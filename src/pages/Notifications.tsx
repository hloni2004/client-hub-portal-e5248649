import { useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const { user } = useAuthStore();
  const { notifications, loading, fetchNotifications, markAllAsRead } = useNotificationStore();

  useEffect(() => {
    if (user) {
      fetchNotifications(user.userId);
    }
  }, [user]);

  const handleMarkAllRead = async () => {
    if (user) {
      await markAllAsRead(user.userId);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with your projects and tasks</p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <Button onClick={handleMarkAllRead} variant="outline">
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {loading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Loading notifications...</p>
            </CardContent>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No notifications yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card key={notification.notificationId} className={!notification.isRead ? 'border-primary' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {!notification.isRead && <Badge variant="default" className="h-2 w-2 p-0 rounded-full" />}
                        {notification.type.replace('_', ' ')}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
