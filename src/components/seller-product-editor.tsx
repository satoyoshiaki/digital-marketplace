"use client";

import { ProductStatus, type Category, type ProductImage, type ProductFile } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SellerProductEditorProps = {
  categories: Category[];
  product?: {
    id: string;
    title: string;
    description: string;
    price: number;
    categoryId: string;
    status: ProductStatus;
    isFeatured: boolean;
    images: ProductImage[];
    files: ProductFile[];
  };
};

export function SellerProductEditor({
  categories,
  product,
}: SellerProductEditorProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const payload = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      price: Number(formData.get("price") ?? "0"),
      categoryId: String(formData.get("categoryId") ?? ""),
      status: String(formData.get("status") ?? ProductStatus.DRAFT),
      isFeatured: formData.get("isFeatured") === "on",
    };

    const response = await fetch(product ? `/api/products/${product.id}` : "/api/products", {
      method: product ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as { id?: string; error?: string };

    if (!response.ok) {
      setError(body.error ?? "Failed to save");
      setLoading(false);
      return;
    }

    const nextId = body.id ?? product?.id;

    const imageFile = formData.get("image") as File | null;
    if (imageFile && nextId && imageFile.size > 0) {
      const upload = new FormData();
      upload.set("file", imageFile);
      upload.set("order", "0");
      upload.set("altText", payload.title);
      await fetch(`/api/products/${nextId}/images`, {
        method: "POST",
        body: upload,
      });
    }

    const digitalFile = formData.get("digitalFile") as File | null;
    if (digitalFile && nextId && digitalFile.size > 0) {
      const upload = new FormData();
      upload.set("file", digitalFile);
      upload.set("filename", digitalFile.name);
      await fetch(`/api/products/${nextId}/files`, {
        method: "POST",
        body: upload,
      });
    }

    router.push("/seller/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product ? "Edit product" : "Create new product"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          action={async (formData) => {
            await onSubmit(formData);
          }}
        >
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={product?.title} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={product?.description} required />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="price">Price (JPY)</Label>
              <Input id="price" name="price" type="number" min={100} defaultValue={product?.price ?? 1000} required />
            </div>
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <select
                id="categoryId"
                name="categoryId"
                defaultValue={product?.categoryId}
                className="h-12 w-full rounded-2xl border border-input bg-white px-4"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={product?.status ?? ProductStatus.DRAFT}
                className="h-12 w-full rounded-2xl border border-input bg-white px-4"
              >
                {Object.values(ProductStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm">
              <input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} />
              Featured product
            </label>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <Label htmlFor="image">Cover image</Label>
              <Input id="image" name="image" type="file" accept="image/*" />
            </div>
            <div>
              <Label htmlFor="digitalFile">Digital file</Label>
              <Input id="digitalFile" name="digitalFile" type="file" />
            </div>
          </div>
          {product?.images.length ? (
            <div className="rounded-3xl border border-border p-4">
              <p className="mb-3 text-sm font-medium">Current images</p>
              <div className="flex flex-wrap gap-3">
                {product.images.map((image) => (
                  <img key={image.id} src={image.url} alt={image.altText ?? product.title} className="h-20 w-20 rounded-2xl object-cover" />
                ))}
              </div>
            </div>
          ) : null}
          {product?.files.length ? (
            <div className="rounded-3xl border border-border p-4">
              <p className="mb-3 text-sm font-medium">Current files</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {product.files.map((file) => (
                  <li key={file.id}>{file.filename}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : product ? "Save changes" : "Create product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
