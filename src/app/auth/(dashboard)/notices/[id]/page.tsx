"use client";

import { NoticeEditor } from "@/components/NoticeEditor";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axiosInstance from "@/app/services/api/api";
import { toast } from "sonner";

interface NoticeFormValues {
  title: string;
  description: string;
  isRead: boolean;
  attachments: Record<string, {
    id: string;
    url: string;
    name: string;
    type: string;
  }>;
}

interface Notice extends NoticeFormValues {
  id: string;
}

export default function NoticePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotice = async () => {
      if (!params?.id) return;
      
      try {
        const response = await axiosInstance.get(`/notices/${params.id}`);
        setNotice(response.data);
      } catch (error) {
        console.error("Error fetching notice:", error);
        toast.error("Failed to load notice");
        router.push("/auth/notices");
      } finally {
        setLoading(false);
      }
    };

    fetchNotice();
  }, [params?.id, router]);

  const handleSave = async (data: NoticeFormValues) => {
    if (!params?.id) return;

    try {
      await axiosInstance.put(`/notices/${params.id}`, data);
      toast.success("Notice updated successfully");
      router.push("/auth/notices");
    } catch (error) {
      console.error("Error saving notice:", error);
      toast.error("Failed to update notice");
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!params?.id) return;

    try {
      await axiosInstance.delete(`/notices/${params.id}`);
      toast.success("Notice deleted successfully");
      router.push("/auth/notices");
    } catch (error) {
      console.error("Error deleting notice:", error);
      toast.error("Failed to delete notice");
      throw error;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!notice) {
    return <div>Notice not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <NoticeEditor
        initialData={{
          title: notice.title,
          description: notice.description,
          isRead: notice.isRead,
          attachments: notice.attachments,
        }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
} 