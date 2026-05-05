# StoreSure Backend API

[![Django](https://img.shields.io/badge/Django-5.0+-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.14+-a30f2d?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![Security](https://img.shields.io/badge/Security-Hardened-blue?style=for-the-badge&logo=security)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

**StoreSure Backend** is a robust, secure, and professional-grade ERP API designed to manage procurement, stores, assets, and more. Built with Django and Django REST Framework, it adheres to modern API standards and strict security protocols.

---

## 🚀 Key Features

### 🔒 Enterprise-Grade Security
- **Production-Ready Auth**: JWT implementation using `simplejwt` with strict token lifetimes.
- **Hardened Configuration**: Environment-based settings (`django-environ`), HSTS, CSP, and secure headers enabled.
- **Input/Output Sanitization**: Automated input validation and standardized securely formatted JSON responses.

### 🛠 Professional API Standards
- **Standardized Responses**: Consistent JSON envelope for all responses (`status`, `data`, `message`).
- **OpenAPI 3.0**: Auto-generated interactive documentation via Swagger UI & Redoc.
- **Versioning**: Explicit URL versioning (`/api/v1/`).
- **Health Monitoring**: Dedicated `/health/` endpoint for uptime checks.

### 🏗 Modular Architecture
- **Scalable Structure**: Domain-driven design with decoupled apps (`core`, `procurement`, `stores`, etc.).
- **Base Components**: Reusable `BaseViewSet` and custom serializers for rapid, consistent development.
- **Database Agnostic**: Configured for PostgreSQL (Production) but supports SQLite for development.

### 🎨 Dynamic UI Framework (Server-Driven UI)
- **UI Config Endpoint**: `/api/v1/ui-config/{view_name}/` provides frontend layout and logic.
- **Metadata Injection**: API responses carry presentation metadata (labels, widgets, ordering).
- **Admin Management**: Full control over UI field properties and components via Django Admin.

---

## 🛠 Tech Stack

- **Framework**: Django 6.0 & Django REST Framework
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: PostgreSQL / SQLite
- **Documentation**: drf-spectacular (OpenAPI 3.0)
- **Utilities**: django-environ, django-cors-headers

---

## ⚡ Getting Started

### Prerequisites
- Python 3.10+
- PostgreSQL (optional, for production parity)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pazinstar/StoreSure-Backend.git store-sure
   cd store-sure
   ```

2. **Set up Virtual Environment**
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # Linux/Mac
   source .venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   Copy the example environment file and configure your secrets.
   ```bash
   cp .env.example .env
   ```
   > **Note:** Update `DATABASE_URL` in `.env` if using PostgreSQL. For local testing with SQLite, the settings are pre-configured to fallback if needed, or you can adjust `settings.py`.

5. **Apply Migrations**
   ```bash
   python manage.py migrate
   ```

6. **Run Server**
   ```bash
   python manage.py runserver
   ```

---

## 📖 API Documentation

Once the server is running, you can explore the full API documentation:

- **Swagger UI**: [http://localhost:8000/api/v1/docs/](http://localhost:8000/api/v1/docs/) - Interactive testing.
- **ReDoc**: [http://localhost:8000/api/v1/redoc/](http://localhost:8000/api/v1/redoc/) - Alternative documentation view.
- **Schema**: [http://localhost:8000/api/v1/schema/](http://localhost:8000/api/v1/schema/) - Raw OpenAPI schema.

### Health Check
- **Endpoint**: `/health/`
- **Method**: `GET`
- **Response**: `{"status": "healthy", ...}`

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

# StoreSure Backend API

[![Django](https://img.shields.io/badge/Django-5.0+-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Django REST Framework](https://img.shields.io/badge/DRF-3.14+-a30f2d?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![Security](https://img.shields.io/badge/Security-Hardened-blue?style=for-the-badge&logo=security)](https://github.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](./LICENSE)

**StoreSure Backend** is a robust, secure, and professional-grade ERP API designed to manage procurement, stores, assets, and more. Built with Django and Django REST Framework, it adheres to modern API standards and strict security protocols.

---

## 🚀 Key Features

### 🔒 Enterprise-Grade Security
- **Production-Ready Auth**: JWT implementation using `simplejwt` with strict token lifetimes.
- **Hardened Configuration**: Environment-based settings (`django-environ`), HSTS, CSP, and secure headers enabled.
- **Input/Output Sanitization**: Automated input validation and standardized securely formatted JSON responses.

### 🛠 Professional API Standards
- **Standardized Responses**: Consistent JSON envelope for all responses (`status`, `data`, `message`).
- **OpenAPI 3.0**: Auto-generated interactive documentation via Swagger UI & Redoc.
- **Versioning**: Explicit URL versioning (`/api/v1/`).
- **Health Monitoring**: Dedicated `/health/` endpoint for uptime checks.

### 🏗 Modular Architecture
- **Scalable Structure**: Domain-driven design with decoupled apps (`core`, `procurement`, `stores`, etc.).
- **Base Components**: Reusable `BaseViewSet` and custom serializers for rapid, consistent development.
- **Database Agnostic**: Configured for PostgreSQL (Production) but supports SQLite for development.

---

## 🛠 Tech Stack

- **Framework**: Django 6.0 & Django REST Framework
- **Authentication**: JWT (JSON Web Tokens)
- **Database**: PostgreSQL / SQLite
- **Documentation**: drf-spectacular (OpenAPI 3.0)
- **Utilities**: django-environ, django-cors-headers

---

## ⚡ Getting Started

### Prerequisites
- Python 3.10+
- PostgreSQL (optional, for production parity)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pazinstar/StoreSure-Backend.git
   cd store-sure
   ```

2. **Set up Virtual Environment**
   ```bash
   python -m venv .venv
   # Windows
   .venv\Scripts\activate
   # Linux/Mac
   source .venv/bin/activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**
   Copy the example environment file and configure your secrets.
   ```bash
   cp .env.example .env
   ```
   > **Note:** Update `DATABASE_URL` in `.env` if using PostgreSQL. For local testing with SQLite, the settings are pre-configured to fallback if needed, or you can adjust `settings.py`.

5. **Apply Migrations**
   ```bash
   python manage.py migrate
   ```

6. **Run Server**
   ```bash
   python manage.py runserver
   ```

---

## 📖 API Documentation

Once the server is running, you can explore the full API documentation:

- **Swagger UI**: [http://localhost:8000/api/v1/docs/](http://localhost:8000/api/v1/docs/) - Interactive testing.
- **ReDoc**: [http://localhost:8000/api/v1/redoc/](http://localhost:8000/api/v1/redoc/) - Alternative documentation view.
- **Schema**: [http://localhost:8000/api/v1/schema/](http://localhost:8000/api/v1/schema/) - Raw OpenAPI schema.

### Health Check
- **Endpoint**: `/health/`
- **Method**: `GET`
- **Response**: `{"status": "healthy", ...}`

---

## 🤝 Contributing

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
