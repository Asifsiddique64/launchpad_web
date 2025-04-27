"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "@/app/services/api/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface Attachment {
  id: string;
  url: string;
  name: string;
  type: string;
}

interface Notice {
  id: string;
  title: string;
  description: string;
  isRead: boolean;
  attachments: Record<string, Attachment>;
  createdAt: string;
}

export default function NoticesPage() {
  const router = useRouter();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await axiosInstance.get("/notices");
        setNotices(response.data);
      } catch (error) {
        console.error("Error fetching notices:", error);
        toast.error("Failed to load notices");
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const handleCreateNotice = () => {
    router.push("/auth/notices/new");
  };

  const handleEditNotice = (id: string) => {
    router.push(`/auth/notices/${id}`);
  };

  const handleToggleRead = async (id: string, isRead: boolean, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when toggling read status
    try {
      await axiosInstance.patch(`/notices/${id}`, { isRead: !isRead });
      setNotices(notices.map(notice => 
        notice.id === id ? { ...notice, isRead: !isRead } : notice
      ));
      toast.success(`Notice marked as ${!isRead ? 'read' : 'unread'}`);
    } catch (error) {
      console.error("Error toggling notice read status:", error);
      toast.error("Failed to update notice status");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex-1 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notices</h1>
        <Button onClick={handleCreateNotice}>
          <Plus className="h-4 w-4 mr-2" />
          Create Notice
        </Button>
      </div>

      <div className="space-y-4">
        {notices.map((notice) => (
          <Card 
            key={notice.id} 
            className="w-full hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => handleEditNotice(notice.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{notice.title}</CardTitle>
              <Switch
                checked={notice.isRead}
                onCheckedChange={(checked) => {
                  const event = new MouseEvent('click') as unknown as React.MouseEvent;
                  handleToggleRead(notice.id, checked, event);
                }}
              />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-start">
                <div 
                  className="text-muted-foreground line-clamp-2 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: notice.description }}
                />
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent card click when clicking edit button
                    handleEditNotice(notice.id);
                  }}
                >
                  Edit
                </Button>
              </div>
              {notice.attachments && Object.keys(notice.attachments).length > 0 && (
                <div className="mt-4 flex gap-4">
                  {Object.entries(notice.attachments).map(([id, attachment]) => (
                    <div key={id} className="relative group">
                      {attachment.type.startsWith('video/') ? (
                        <video
                          src={attachment.url}
                          className="w-48 h-48 object-cover rounded-lg"
                          controls
                        />
                      ) : (
                        <img
                          src={attachment.url}
                          alt={attachment.name}
                          className="w-48 h-48 object-cover rounded-lg"
                          onError={(e) => {
                            console.error(`Failed to load image: ${attachment.url}`);
                            e.currentTarget.src = '/placeholder-image.png';
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 