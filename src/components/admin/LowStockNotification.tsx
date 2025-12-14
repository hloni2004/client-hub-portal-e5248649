import { useEffect } from 'react';
import { AlertCircle, X, Bell } from 'lucide-react';
import { useLowStockStore } from '@/stores/ecommerce/lowStockStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function LowStockNotification() {
  const { alerts, unreadCount, fetchLowStockAlerts, dismissAlert, clearAllAlerts, markAsRead } = useLowStockStore();

  useEffect(() => {
    fetchLowStockAlerts();
    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchLowStockAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchLowStockAlerts]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-10 w-10 hover:bg-accent"
          title="View low stock alerts"
        >
          <Bell className="h-5 w-5 text-orange-600" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Low Stock Alerts
          </SheetTitle>
          <SheetDescription>
            {alerts.length === 0
              ? 'No low stock items at the moment'
              : `${alerts.length} product(s) below reorder level`}
          </SheetDescription>
        </SheetHeader>

        {alerts.length > 0 && (
          <div className="mt-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllAlerts}
              className="w-full"
            >
              Clear All
            </Button>
          </div>
        )}

        <ScrollArea className="h-[400px]">
          <div className="space-y-3 pr-4">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  All products are well stocked
                </p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={`${alert.id}-${alert.size || ''}`}
                  className="border border-red-200 bg-red-50 rounded-lg p-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-red-900 truncate">
                        {alert.name}
                      </p>
                      <p className="text-xs text-red-700">SKU: {alert.sku}</p>
                      {alert.size && (
                        <p className="text-xs text-red-700">Size: {alert.size}</p>
                      )}
                      {alert.color && (
                        <p className="text-xs text-red-700">Color: {alert.color}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex justify-between items-center text-xs mb-1">
                            <span className="text-red-700">Stock: {alert.currentStock}</span>
                            <span className="text-red-600">Reorder: {alert.reorderLevel}</span>
                          </div>
                          <div className="h-2 bg-red-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 transition-all"
                              style={{
                                width: `${Math.min(
                                  (alert.currentStock / alert.reorderLevel) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
