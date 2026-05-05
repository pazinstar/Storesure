import { useState } from "react";
import { Bell, Mail, Check, CheckCheck, Trash2, Star, X, ExternalLink, PenSquare, Send, Reply, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useNotifications, Notification } from "@/contexts/NotificationContext";
import { useMessages, Message } from "@/contexts/MessageContext";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const typeStyles = {
    info: "bg-blue-500",
    warning: "bg-amber-500",
    success: "bg-emerald-500",
    error: "bg-red-500",
  };

  return (
    <div
      className={cn(
        "p-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", typeStyles[notification.type])} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={cn("text-sm font-medium truncate", !notification.read && "font-semibold")}>
              {notification.title}
            </h4>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
          <div className="flex items-center gap-1 mt-2">
            {notification.link && (
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" asChild>
                <Link to={notification.link}>
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Link>
              </Button>
            )}
            {!notification.read && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onMarkAsRead(notification.id)}
              >
                <Check className="h-3 w-3 mr-1" />
                Mark read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
              onClick={() => onDelete(notification.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageItem({
  message,
  onMarkAsRead,
  onToggleStar,
  onDelete,
  onView,
}: {
  message: Message;
  onMarkAsRead: (id: string) => void;
  onToggleStar: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (message: Message) => void;
}) {
  const isSent = message.folder === "sent";
  const displayName = isSent ? message.recipientName : message.senderName;
  const displayRole = isSent ? "To" : message.senderRole;

  const handleClick = () => {
    if (!message.read) {
      onMarkAsRead(message.id);
    }
    onView(message);
  };

  return (
    <div
      className={cn(
        "p-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer",
        !message.read && "bg-primary/5"
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
          {displayName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h4 className={cn("text-sm truncate", !message.read && "font-semibold")}>
                {displayName}
              </h4>
              <Badge variant={isSent ? "secondary" : "outline"} className="text-[10px] px-1.5 py-0 h-4">
                {displayRole}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
            </span>
          </div>
          <p className={cn("text-sm truncate mt-0.5", !message.read && "font-medium")}>
            {message.subject}
          </p>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{message.content}</p>
          <div className="flex items-center gap-1 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-6 px-2 text-xs", message.starred && "text-amber-500")}
              onClick={(e) => {
                e.stopPropagation();
                onToggleStar(message.id);
              }}
            >
              <Star className={cn("h-3 w-3", message.starred && "fill-amber-500")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(message.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ViewMessageDialog({
  message,
  open,
  onOpenChange,
  onReply,
}: {
  message: Message | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReply: (message: Message) => void;
}) {
  if (!message) return null;

  const isSent = message.folder === "sent";
  const displayName = isSent ? message.recipientName : message.senderName;
  const displayRole = isSent ? "Recipient" : message.senderRole;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <Mail className="h-5 w-5 shrink-0" />
            <span className="truncate">{message.subject}</span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            View message details
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Message Header */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold shrink-0">
              {displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{displayName}</span>
                <Badge variant="outline" className="text-xs">
                  {displayRole}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(message.timestamp, "EEEE, MMMM d, yyyy 'at' h:mm a")}
              </p>
              {isSent && (
                <p className="text-xs text-muted-foreground mt-1">
                  Sent to: {message.recipientName}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Message Content */}
          <ScrollArea className="h-[200px]">
            <div className="pr-4">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {message.content}
              </p>
            </div>
          </ScrollArea>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!isSent && (
            <Button onClick={() => onReply(message)}>
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ComposeMessageDialog({
  open,
  onOpenChange,
  replyTo,
  onClearReply,
}: {
  open: boolean;
  onClearReply?: () => void;
}) {
  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.getUsers(),
  });
  const { user: currentUser } = useAuth();
  const { sendMessage } = useMessages();
  const { toast } = useToast();

  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // Filter out current user from recipients
  const availableRecipients = users.filter(
    (u) => u.status === "active" && u.email !== currentUser?.email
  );

  // Handle reply pre-fill
  const isReply = !!replyTo;
  const replyRecipient = isReply
    ? users.find((u) => u.id === replyTo.senderId || u.name === replyTo.senderName)
    : null;

  const handleSend = async () => {
    const finalRecipientId = isReply && replyRecipient ? replyRecipient.id : recipientId;
    const finalSubject = isReply ? `Re: ${replyTo.subject}` : subject.trim();

    if (!finalRecipientId || !finalSubject || !content.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (finalSubject.length > 100) {
      toast({
        title: "Validation Error",
        description: "Subject must be less than 100 characters",
        variant: "destructive",
      });
      return;
    }

    if (content.length > 2000) {
      toast({
        title: "Validation Error",
        description: "Message must be less than 2000 characters",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    const recipient = users.find((u) => u.id === finalRecipientId);
    if (!recipient) {
      toast({
        title: "Error",
        description: "Recipient not found",
        variant: "destructive",
      });
      setSending(false);
      return;
    }

    setSending(true);
    try {
      await sendMessage(
        recipient.id,
        recipient.name,
        recipient.role?.replace("_", " ") || "No Role",
        finalSubject,
        content.trim()
      );
      toast({
        title: "Message Sent",
        description: `Your message has been sent to ${recipient.name}`,
      });
      setRecipientId("");
      setSubject("");
      setContent("");
      onClearReply?.();
      onOpenChange(false);
    } catch {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setRecipientId("");
    setSubject("");
    setContent("");
    onClearReply?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReply ? <Reply className="h-5 w-5" /> : <PenSquare className="h-5 w-5" />}
            {isReply ? "Reply to Message" : "Compose Message"}
          </DialogTitle>
          <DialogDescription>
            {isReply
              ? `Replying to ${replyTo.senderName}`
              : "Send a message to another user in the system"}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isReply ? (
            <div className="space-y-2">
              <Label>To</Label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                  {replyTo.senderName.charAt(0)}
                </div>
                <span className="text-sm font-medium">{replyTo.senderName}</span>
                <Badge variant="outline" className="text-xs">
                  {replyTo.senderRole}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="recipient">To</Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger id="recipient">
                  <SelectValue placeholder="Select recipient..." />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {availableRecipients.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <span>{user.name || "Unnamed"}</span>
                        <span className="text-xs text-muted-foreground">
                          ({user.role?.replace("_", " ") || "No Role"})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isReply ? (
            <div className="space-y-2">
              <Label>Subject</Label>
              <div className="p-2 bg-muted rounded-md text-sm">
                Re: {replyTo.subject}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter message subject..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">
                {subject.length}/100
              </p>
            </div>
          )}

          {isReply && (
            <div className="p-3 bg-muted/50 rounded-md border-l-2 border-primary/30">
              <p className="text-xs text-muted-foreground mb-1">
                On {format(replyTo.timestamp, "MMM d, yyyy 'at' h:mm a")}, {replyTo.senderName} wrote:
              </p>
              <p className="text-xs text-muted-foreground line-clamp-3 italic">
                {replyTo.content}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              placeholder="Type your message here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {content.length}/2000
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending}>
            <Send className="h-4 w-4 mr-2" />
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function HeaderActions() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updatingPwd, setUpdatingPwd] = useState(false);

  const {
    notifications,
    unreadCount: unreadNotifications,
    markAsRead: markNotificationRead,
    markAllAsRead: markAllNotificationsRead,
    deleteNotification,
    clearAll: clearAllNotifications,
  } = useNotifications();

  const {
    messages,
    unreadCount: unreadMessages,
    markAsRead: markMessageRead,
    markAllAsRead: markAllMessagesRead,
    toggleStar,
    deleteMessage,
  } = useMessages();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    setMessagesOpen(false);
    setViewOpen(true);
  };

  const handleReply = (message: Message) => {
    setReplyToMessage(message);
    setViewOpen(false);
    setComposeOpen(true);
  };

  const handleClearReply = () => {
    setReplyToMessage(null);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Messages */}
      <Popover open={messagesOpen} onOpenChange={setMessagesOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Mail className="h-5 w-5" />
            {unreadMessages > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                {unreadMessages > 9 ? "9+" : unreadMessages}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0 bg-popover z-50" align="end">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold">Messages</h3>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setMessagesOpen(false);
                  setReplyToMessage(null);
                  setComposeOpen(true);
                }}
              >
                <PenSquare className="h-3 w-3 mr-1" />
                Compose
              </Button>
              {unreadMessages > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={markAllMessagesRead}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setMessagesOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[400px]">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Mail className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No messages</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setMessagesOpen(false);
                    setReplyToMessage(null);
                    setComposeOpen(true);
                  }}
                >
                  <PenSquare className="h-3 w-3 mr-1" />
                  Compose a message
                </Button>
              </div>
            ) : (
              messages.map((message) => (
                <MessageItem
                  key={message.id}
                  message={message}
                  onMarkAsRead={markMessageRead}
                  onToggleStar={toggleStar}
                  onDelete={deleteMessage}
                  onView={handleViewMessage}
                />
              ))
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* View Message Dialog */}
      <ViewMessageDialog
        message={selectedMessage}
        open={viewOpen}
        onOpenChange={setViewOpen}
        onReply={handleReply}
      />

      {/* Compose Dialog */}
      <ComposeMessageDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        replyTo={replyToMessage}
        onClearReply={handleClearReply}
      />

      {/* Notifications */}
      <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                {unreadNotifications > 9 ? "9+" : unreadNotifications}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0 bg-popover z-50" align="end">
          <div className="flex items-center justify-between p-3 border-b border-border">
            <h3 className="font-semibold">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadNotifications > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={markAllNotificationsRead}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive"
                  onClick={clearAllNotifications}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setNotificationsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <ScrollArea className="h-[400px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={markNotificationRead}
                  onDelete={deleteNotification}
                />
              ))
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* User Menu - modern dropdown */}
      <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-1">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {user?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{user?.name}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize shrink-0">
                  {user?.role?.replace("_", " ")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              setUserMenuOpen(false);
              setPasswordOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <PenSquare className="h-4 w-4" />
            <span>Update Password</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setUserMenuOpen(false);
              logout();
            }}
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Update Password Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Password</DialogTitle>
            <DialogDescription>Change your password for future logins</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (newPassword.length < 8) {
                  toast({ title: "Password too short", description: "Use at least 8 characters", variant: "destructive" });
                  return;
                }
                if (newPassword !== confirmNewPassword) {
                  toast({ title: "Passwords do not match", description: "Please confirm the new password", variant: "destructive" });
                  return;
                }
                setUpdatingPwd(true);
                setTimeout(() => {
                  setUpdatingPwd(false);
                  setPasswordOpen(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                  toast({ title: "Password updated", description: "Your password change will apply on next sign-in" });
                }, 600);
              }}
              disabled={updatingPwd}
            >
              {updatingPwd ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
