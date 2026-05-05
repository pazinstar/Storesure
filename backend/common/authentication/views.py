from django.contrib.auth.models import User as DjangoUser
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.authentication import JWTAuthentication

from roles.admin.users.models import SystemUser
from roles.admin.dashboard.models import Role, SystemSetup


def _build_user_profile(system_user):
    """
    Build the user profile dict (permissions + school data) for a SystemUser.
    Returns (user_dict, school_dict, allowed_modules, role_permissions).
    Permissions are taken directly from the role DB — no school intersection.
    The school ceiling is enforced at Role Management time, not at login time.
    """
    # Resolve role permissions from DB
    role_permissions = []
    try:
        role_obj = Role.objects.prefetch_related(
            "module_permissions__links"
        ).get(id=system_user.role)
        for mp in role_obj.module_permissions.all():
            # Only include modules the role can view
            if not mp.can_view:
                continue
            role_permissions.append({
                "moduleId": mp.module_id,
                "moduleName": mp.module_name,
                "canView": mp.can_view,
                "canCreate": mp.can_create,
                "canEdit": mp.can_edit,
                "canDelete": mp.can_delete,
                # Only include links that are explicitly enabled for this role
                "links": [
                    {"href": lnk.href, "name": lnk.name}
                    for lnk in mp.links.all()
                    if lnk.enabled
                ],
            })
    except Role.DoesNotExist:
        pass  # Role not configured — user gets no module permissions

    # Resolve school data
    school_data = None
    school_modules_enabled = []  # full school config — used only as ceiling for Role Management UI

    if system_user.school:
        school = system_user.school
        school_data = {
            "id": school.id,
            "name": school.name,
            "code": school.code,
            "type": school.type,
            "category": school.category,
            "county": school.county,
            "subscriptionPlan": school.subscription_plan,
            "expiryDate": str(school.expiry_date) if school.expiry_date else None,
        }
        try:
            setup = SystemSetup.objects.get(school=school)
            raw = setup.modules_enabled or []
            # Normalise: stored as list of strings OR list of dicts
            school_modules_enabled = [
                m if isinstance(m, dict) else {"id": m, "enabled": True, "links": []}
                for m in raw
            ]
        except SystemSetup.DoesNotExist:
            school_modules_enabled = []

    # Build the modules list for this user:
    # - Admin (no school): return full school_modules_enabled (empty for super-admin, which is fine)
    # - All other roles: return only the modules/links the role has been assigned (canView=True)
    #   filtered against what the school has enabled.
    viewable_ids = {rp["moduleId"] for rp in role_permissions if rp["canView"]}
    school_mod_map = {m["id"]: m for m in school_modules_enabled}

    if system_user.role == "admin":
        # Admin gets the full school config so Role Management UI can show/enforce the ceiling
        allowed_modules = school_modules_enabled
    else:
        # Each role gets only the modules they have canView access to.
        # rp["links"] already contains only enabled links (filtered above).
        # Additionally filter by school ceiling: skip links disabled at school level.
        allowed_modules = []
        for rp in role_permissions:
            school_mod = school_mod_map.get(rp["moduleId"])
            # Skip module if school has explicitly disabled it
            if school_mod and not school_mod.get("enabled", True):
                continue
            school_links = {lnk["href"]: lnk for lnk in (school_mod or {}).get("links", [])}
            # rp["links"] are already enabled at role level; further filter by school
            role_links = [
                lnk for lnk in rp["links"]
                if school_links.get(lnk["href"], {}).get("enabled", True)
            ]
            allowed_modules.append({
                "id": rp["moduleId"],
                "name": rp["moduleName"],
                "links": role_links,
            })

    user_dict = {
        "id": system_user.id,
        "name": system_user.name or system_user.username or system_user.email,
        "email": system_user.email,
        "role": system_user.role,
        "status": system_user.status,
    }

    return user_dict, school_data, allowed_modules, role_permissions


class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Body: { "email": "...", "password": "..." }

    Returns JWT tokens + full user profile (school, modules, role permissions).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip().lower()
        password = request.data.get("password", "")

        if not email or not password:
            return Response(
                {"detail": "Email and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 1. Authenticate against Django's User by email
        try:
            django_user = DjangoUser.objects.get(email__iexact=email)
        except DjangoUser.DoesNotExist:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not django_user.check_password(password):
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not django_user.is_active:
            return Response(
                {"detail": "Account is disabled."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Find the matching SystemUser
        try:
            system_user = SystemUser.objects.select_related("school").get(email__iexact=email)
        except SystemUser.DoesNotExist:
            return Response(
                {"detail": "User account is not fully configured. Contact your administrator."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if system_user.status.lower() not in ("active",):
            return Response(
                {"detail": "Your account has been deactivated."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 3. Build profile
        user_dict, school_data, allowed_modules, role_permissions = _build_user_profile(system_user)

        # 4. Issue JWT tokens
        refresh = RefreshToken.for_user(django_user)
        refresh["role"] = system_user.role
        refresh["userId"] = system_user.id
        if system_user.school_id:
            refresh["schoolId"] = system_user.school_id

        # 5. Update last login
        system_user.lastLogin = timezone.now()
        system_user.save(update_fields=["lastLogin"])

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": user_dict,
            "school": school_data,
            "modules": allowed_modules,
            "permissions": role_permissions,
        })


class MeView(APIView):
    """
    GET /api/v1/auth/me/
    Returns the current user's fresh profile + permissions (no new tokens).
    Used by the frontend to refresh permissions in the background after
    an admin changes role configuration.
    """
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            system_user = SystemUser.objects.select_related("school").get(
                email__iexact=request.user.email
            )
        except SystemUser.DoesNotExist:
            return Response(
                {"detail": "User profile not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user_dict, school_data, allowed_modules, role_permissions = _build_user_profile(system_user)

        return Response({
            "user": user_dict,
            "school": school_data,
            "modules": allowed_modules,
            "permissions": role_permissions,
        })


class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Body: { "refresh": "<refresh_token>" }
    Blacklists the refresh token to invalidate the session.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception:
                pass  # Already blacklisted or invalid — treat as success
        return Response({"detail": "Logged out successfully."}, status=status.HTTP_200_OK)
