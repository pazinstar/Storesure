import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { useMessages, Message } from "@/contexts/MessageContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { usersService } from "@/services/users.service";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { cn } from "@/lib/utils";
import {
  Mail,
  Inbox,
  Send,
  Star,
  Search,
  PenSquare,
  Reply,
  Trash2,
  CheckCheck,
  MailOpen,
  Clock,
} from "lucide-react";

export default function Messages() {
  const {
    messages,
    unreadCount,
    markAsRead,
    markAllAsRead,
    toggleStar,
    deleteMessage,
    sendMessage,
    getInboxMessages,
    getSentMessages,
  } = useMessages();
  const { addNotification } = useNotifications();
  const { user } = useAuth();

  const { data: users = [] } = useQuery({
    queryKey: ["users"],
    queryFn: () => usersService.getUsers(),
  });

  const [tab, setTab] = useState("inbox");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);

  // Compose form
  const [recipientId, setRecipientId] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");

  const availableRecipients = users.filter(
    (u) => u.status === "active" && u.email !== user?.email
  );

  const inboxMessages = getInboxMessages();
  const sentMessages = getSentMessages();
  const starredMessages = messages.filter((m) => m.starred);

  const getDisplayMessages = () => {
    let list: Message[] = [];
    switch (tab) {
      case "inbox":
        list = inboxMessages;
        break;
      case "sent":
        list = sentMessages;
        break;
      case "starred":
        list = starredMessages;
        break;
      default:
        list = inboxMessages;
    }
    if (searchTerm) {
      const lc = searchTerm.toLowerCase();
      list = list.filter(
        (m) =>
          m.subject.toLowerCase().includes(lc) ||
          m.senderName.toLowerCase().includes(lc) ||
          m.recipientName.toLowerCase().includes(lc) ||
          m.content.toLowerCase().includes(lc)
      );
    }
    return list;
  };

  const displayMessages = getDisplayMessages();

  const handleSelectMessage = (msg: Message) => {
    if (!msg.read) markAsRead(msg.id);
    setSelectedMessage(msg);
  };

  const handleReply = (msg: Message) => {
    setReplyTo(msg);
    setRecipientId(msg.senderId);
    setSubject(`Re: ${msg.subject}`);
    setContent("");
    setComposeOpen(true);
  };

  const handleCompose = () => {
    setReplyTo(null);
    setRecipientId("");
    setSubject("");
    setContent("");
    setComposeOpen(true);
  };

  const handleSend = async () => {
    const finalRecipientId = replyTo ? replyTo.senderId : recipientId;
    const finalSubject = replyTo ? `Re: ${replyTo.subject}` : subject.trim();

    if (!finalRecipientId || !finalSubject || !content.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const recipient = users.find((u) => u.id === finalRecipientId);
    if (!recipient) {
      toast.error("Recipient not found");
      return;
    }

    try {
      await sendMessage(
        recipient.id,
        recipient.name,
        recipient.role?.replace("_", " ") || "User",
        finalSubject,
        content.trim()
      );

      addNotification({
        title: "Message Sent",
        message: `To ${recipient.name}: ${finalSubject}`,
        type: "info",
        link: "/messages",
      });

      toast.success(`Message sent to ${recipient.name}`);
    } catch {
      toast.error("Failed to send message");
      return;
    }

    setComposeOpen(false);
    setReplyTo(null);
    setRecipientId("");
    setSubject("");
    setContent("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">
            Send and receive messages with other users
          </p>
        </div>
        <Button className="gap-2" onClick={handleCompose}>
          <PenSquare className="h-4 w-4" />
          Compose
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                <Inbox className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inbox</p>
                <p className="text-2xl font-bold">{inboxMessages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10">
                <Mail className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <Send className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold">{sentMessages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10">
                <Star className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Starred</p>
                <p className="text-2xl font-bold">{starredMessages.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Message List */}
        <Card className="min-w-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Mailbox</CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-3 w-3 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="w-full rounded-none border-b bg-transparent h-auto p-0">
                <TabsTrigger
                  value="inbox"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5"
                >
                  <Inbox className="h-3.5 w-3.5 mr-1.5" />
                  Inbox
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[10px]">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="sent"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  Sent
                </TabsTrigger>
                <TabsTrigger
                  value="starred"
                  className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent py-2.5"
                >
                  <Star className="h-3.5 w-3.5 mr-1.5" />
                  Starred
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[500px]">
                {displayMessages.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <MailOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No messages</p>
                    <p className="text-xs mt-1">
                      {tab === "inbox"
                        ? "Your inbox is empty"
                        : tab === "sent"
                        ? "No sent messages yet"
                        : "No starred messages"}
                    </p>
                  </div>
                ) : (
                  displayMessages.map((msg) => {
                    const isSent = msg.folder === "sent";
                    const displayName = isSent
                      ? msg.recipientName
                      : msg.senderName;
                    const isSelected = selectedMessage?.id === msg.id;

                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "p-3 border-b border-border cursor-pointer transition-colors",
                          "hover:bg-muted/50",
                          !msg.read && "bg-primary/5",
                          isSelected && "bg-muted"
                        )}
                        onClick={() => handleSelectMessage(msg)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                            {displayName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={cn(
                                    "text-sm truncate",
                                    !msg.read && "font-semibold"
                                  )}
                                >
                                  {displayName}
                                </span>
                                {isSent && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[9px] px-1 py-0 h-3.5"
                                  >
                                    Sent
                                  </Badge>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                {formatDistanceToNow(msg.timestamp, {
                                  addSuffix: true,
                                })}
                              </span>
                            </div>
                            <p
                              className={cn(
                                "text-sm truncate",
                                !msg.read ? "font-medium" : "text-muted-foreground"
                              )}
                            >
                              {msg.subject}
                            </p>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {msg.content}
                            </p>
                          </div>
                          {msg.starred && (
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className="min-w-0">
          {selectedMessage ? (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-lg truncate">
                    {selectedMessage.subject}
                  </CardTitle>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleStar(selectedMessage.id)}
                    >
                      <Star
                        className={cn(
                          "h-4 w-4",
                          selectedMessage.starred &&
                            "text-amber-500 fill-amber-500"
                        )}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => {
                        deleteMessage(selectedMessage.id);
                        setSelectedMessage(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Sender/Recipient Info */}
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                      {selectedMessage.folder === "sent"
                        ? selectedMessage.recipientName.charAt(0)
                        : selectedMessage.senderName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {selectedMessage.folder === "sent"
                            ? selectedMessage.recipientName
                            : selectedMessage.senderName}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {selectedMessage.folder === "sent"
                            ? "Recipient"
                            : selectedMessage.senderRole}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        {format(
                          selectedMessage.timestamp,
                          "EEEE, MMMM d, yyyy 'at' h:mm a"
                        )}
                      </div>
                      {selectedMessage.folder === "sent" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          To: {selectedMessage.recipientName}
                        </p>
                      )}
                      {selectedMessage.folder === "inbox" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          From: {selectedMessage.senderName} &middot; To: You
                        </p>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Message Body */}
                  <ScrollArea className="h-[280px]">
                    <div className="pr-4">
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {selectedMessage.content}
                      </p>
                    </div>
                  </ScrollArea>

                  <Separator />

                  {/* Actions */}
                  <div className="flex gap-2">
                    {selectedMessage.folder === "inbox" && (
                      <Button onClick={() => handleReply(selectedMessage)}>
                        <Reply className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleCompose}>
                      <PenSquare className="h-4 w-4 mr-2" />
                      New Message
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-[600px]">
              <div className="text-center text-muted-foreground">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a message</p>
                <p className="text-sm mt-1">
                  Choose a message from the list to view its contents
                </p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={handleCompose}
                >
                  <PenSquare className="h-4 w-4 mr-2" />
                  Compose New Message
                </Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Compose Dialog */}
      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {replyTo ? (
                <Reply className="h-5 w-5" />
              ) : (
                <PenSquare className="h-5 w-5" />
              )}
              {replyTo ? "Reply to Message" : "Compose Message"}
            </DialogTitle>
            <DialogDescription>
              {replyTo
                ? `Replying to ${replyTo.senderName}`
                : "Send a message to another user in the system"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {replyTo ? (
              <div className="space-y-2">
                <Label>To</Label>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs">
                    {replyTo.senderName.charAt(0)}
                  </div>
                  <span className="text-sm font-medium">
                    {replyTo.senderName}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {replyTo.senderRole}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>To</Label>
                <Select value={recipientId} onValueChange={setRecipientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRecipients.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <span>{u.name || "Unnamed"}</span>
                          <span className="text-xs text-muted-foreground">
                            ({u.role?.replace("_", " ") || "No Role"})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {replyTo ? (
              <div className="space-y-2">
                <Label>Subject</Label>
                <div className="p-2 bg-muted rounded-md text-sm">
                  Re: {replyTo.subject}
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
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

            {replyTo && (
              <div className="p-3 bg-muted/50 rounded-md border-l-2 border-primary/30">
                <p className="text-xs text-muted-foreground mb-1">
                  On{" "}
                  {format(
                    replyTo.timestamp,
                    "MMM d, yyyy 'at' h:mm a"
                  )}
                  , {replyTo.senderName} wrote:
                </p>
                <p className="text-xs text-muted-foreground line-clamp-3 italic">
                  {replyTo.content}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
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
            <Button variant="outline" onClick={() => setComposeOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend}>
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
