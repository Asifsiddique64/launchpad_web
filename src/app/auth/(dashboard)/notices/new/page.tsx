"use client";

import { NoticeEditor } from "@/components/NoticeEditor";
import { useRouter } from "next/navigation";
import axiosInstance from "@/app/services/api/api";

interface NoticeFormValues {
  title: string;
  description: string;
  isRead: boolean;
  attachments: string[];
}

export default function NewNoticePage() {
  const router = useRouter();

  const handleSave = async (data: NoticeFormValues) => {
    try {
      await axiosInstance.post("/notices", data);
      router.push("/auth/notices");
    } catch (error) {
      console.error("Error creating notice:", error);
      throw error;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <NoticeEditor onSave={handleSave} />
    </div>
  );
} 