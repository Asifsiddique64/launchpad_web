"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Editor } from "@tinymce/tinymce-react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { X, Upload, Trash2 } from "lucide-react";
import axiosInstance from "@/app/services/api/api";
import fileUploadApi from "@/app/services/api/fileUploadApi";

interface Attachment {
  id: string;
  url: string;
  name: string;
  type: string;
}

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  isRead: z.boolean(),
  attachments: z.record(z.string(), z.object({
    id: z.string(),
    url: z.string(),
    name: z.string(),
    type: z.string(),
  })).nullable().optional(),
});

type NoticeFormValues = z.infer<typeof formSchema>;

interface NoticeEditorProps {
  initialData?: Partial<NoticeFormValues>;
  onSave?: (data: NoticeFormValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export function NoticeEditor({ initialData, onSave, onDelete }: NoticeEditorProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [attachments, setAttachments] = React.useState<Record<string, Attachment>>(
    initialData?.attachments || {}
  );

  const form = useForm<NoticeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      isRead: initialData?.isRead || false,
      attachments: initialData?.attachments || {},
    },
  });

  const handleSubmit = async (data: NoticeFormValues) => {
    try {
      if (onSave) {
        await onSave(data);
        router.push("/auth/notices");
      }
    } catch (error) {
      toast.error("Failed to save notice");
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      if (onDelete) {
        await onDelete();
        router.push("/auth/notices");
      }
    } catch (error) {
      toast.error("Failed to delete notice");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    try {
      setIsUploading(true);
      const newAttachments: Record<string, Attachment> = {};
      
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fileUploadApi.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const { id, url } = response.data;
        
        newAttachments[id] = {
          id,
          url,
          name: file.name,
          type: file.type,
        };
      }

      setAttachments(prev => ({ ...prev, ...newAttachments }));
      form.setValue("attachments", { ...attachments, ...newAttachments });
      toast.success("Files uploaded successfully");
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setIsUploading(false);
    }
  };

  const removeAttachment = async (id: string) => {
    try {
      // Delete the file from the server
      await fileUploadApi.delete(`/upload?filename=${id}`);
      
      const newAttachments = { ...attachments };
      delete newAttachments[id];
      setAttachments(newAttachments);
      form.setValue("attachments", newAttachments);
      toast.success("File removed successfully");
    } catch (error) {
      console.error("Error removing file:", error);
      toast.error("Failed to remove file");
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Notice Editor</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="isRead"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormLabel>Mark as Read</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter notice title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Editor
                      apiKey="y38ilmth3f2om2ec00qasejjr1ydjen99huums7x6ity9ils"
                      init={{
                        height: 300,
                        menubar: false,
                        plugins: [
                          "advlist", "autolink", "lists", "link", "image", "charmap", "preview",
                          "anchor", "searchreplace", "visualblocks", "code", "fullscreen",
                          "insertdatetime", "media", "table", "code", "help", "wordcount"
                        ],
                        toolbar:
                          "undo redo | blocks | " +
                          "bold italic underline | alignleft aligncenter " +
                          "alignright alignjustify | bullist numlist outdent indent | " +
                          "removeformat | help",
                      }}
                      onEditorChange={(content: string) => field.onChange(content)}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <FormLabel>Attachments</FormLabel>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Object.entries(attachments).map(([id, attachment]) => (
                  <div key={id} className="relative group">
                    {attachment.type.startsWith('video/') ? (
                      <video
                        src={attachment.url}
                        className="w-full h-32 object-cover rounded-lg"
                        controls
                      />
                    ) : (
                      <img
                        src={attachment.url}
                        alt={attachment.name}
                        className="w-full h-32 object-cover rounded-lg"
                        onError={(e) => {
                          console.error(`Failed to load image: ${attachment.url}`);
                          e.currentTarget.src = '/placeholder-image.png';
                        }}
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(id)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  disabled={isUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Files"}
                </Button>
              </div>
            </div>

            <div className="flex justify-between">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Notice
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the notice.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button type="submit">Save Notice</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
} 