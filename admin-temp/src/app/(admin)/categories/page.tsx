"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categoryDescriptionFromApi } from "@/lib/categoryDisplay";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosInstance";
import { useCanAdminWrite } from "@/lib/adminAuth";

interface Category {
  category_id: string;
  category_name: string;
  category_description?: string | null;
  status: boolean;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [editCategory, setEditCategory] = useState<null | {
    category_id: string;
    category_name: string;
    category_description: string;
  }>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<null | string>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const canWrite = useCanAdminWrite();

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };  

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("get-all-categories/");
      if (response.data.status_code === 200) {
        setCategories(
          response.data.data.map((row: Category & Record<string, unknown>) => ({
            ...row,
            category_description: categoryDescriptionFromApi(row),
          })),
        );
      } else {
        toast.error(response.data.message || "Failed to fetch categories");
      }
    } catch {
      toast.error("An error occurred while fetching categories");
    } finally {
      setIsLoading(false);
    }
  };
  

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((category) => {
    const q = searchTerm.toLowerCase();
    return (
      category.category_name.toLowerCase().includes(q) ||
      (category.category_description ?? "").toLowerCase().includes(q)
    );
  });

  const handleAddCategory = async () => {
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }
    if (newCategory.name.trim() === "") {
      toast.error("Category name is required");
      return;
    }
  
    try {
      setIsLoading(true);
      const response = await axiosInstance.post("create-category/", {
        category_name: newCategory.name,
        ...(newCategory.description.trim()
          ? { category_description: newCategory.description.trim() }
          : {}),
      });
  
      if (response.data.status_code === 201) {
        toast.success("Category created successfully");
        setNewCategory({ name: "", description: "" });
        setIsAddDialogOpen(false);
        fetchCategories();
      } else {
        toast.error(response.data.message || "Failed to create category");
      }
    } catch {
      toast.error("An error occurred while creating category");
    } finally {
      setIsLoading(false);
    }
  };
  

  const handleEditCategory = async () => {
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }
    if (!editCategory || editCategory.category_name.trim() === "") {
      toast.error("Category name is required");
      return;
    }
  
    try {
      setIsLoading(true);
      const response = await axiosInstance.put(`update-category/${editCategory.category_id}/`, {
        category_name: editCategory.category_name,
        category_description: editCategory.category_description.trim() || null,
      });
  
      if (response.data.status_code === 200) {
        toast.success("Category updated successfully");
        setEditCategory(null);
        setIsEditDialogOpen(false);
        fetchCategories();
      } else {
        toast.error(response.data.message || "Failed to update category");
      }
    } catch {
      toast.error("An error occurred while updating category");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!canWrite) {
      toast.error("Read-only access");
      return;
    }
    if (categoryToDelete === null) return;
  
    try {
      setIsLoading(true);
      const response = await axiosInstance.delete(`delete-category/${categoryToDelete}/`);
  
      if (response.data.status_code === 200) {
        toast.success("Category deleted successfully");
        setCategories(categories.filter((category) => category.category_id !== categoryToDelete));
        setCategoryToDelete(null);
        setIsDeleteDialogOpen(false);
      } else {
        toast.error(response.data.message || "Failed to delete category");
      }
    } catch {
      toast.error("An error occurred while deleting category");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categories Management</h1>
        <Dialog
          open={isAddDialogOpen}
          onOpenChange={(open) => {
            if (open && !canWrite) return;
            setIsAddDialogOpen(open);
          }}
        >
          <DialogTrigger asChild>
            <Button disabled={isLoading || !canWrite} title={!canWrite ? "Read-only role" : undefined}>
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>Create a new category for tasks in your platform.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="e.g., Animation"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Short description (optional)</Label>
                <Textarea
                  id="description"
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  placeholder="e.g., Plumbing repairs, installs, and maintenance"
                  rows={2}
                  maxLength={160}
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">Shown on the public Categories page (max 160 characters).</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleAddCategory} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Category"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search categories..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="max-w-md">Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.category_id}>
                  <TableCell className="font-medium">{category.category_name}</TableCell>
                  <TableCell className="max-w-md text-sm text-muted-foreground">
                    {category.category_description?.trim() ? (
                      <span className="line-clamp-2">{category.category_description}</span>
                    ) : (
                      <span className="italic text-muted-foreground/70">—</span>
                    )}
                  </TableCell>
                  <TableCell>{category.status ? "Inactive" : "Active"}</TableCell>
                  <TableCell>{formatDate(category.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Dialog
                        open={isEditDialogOpen && editCategory?.category_id === category.category_id}
                        onOpenChange={(open) => {
                          setIsEditDialogOpen(open);
                          if (!open) setEditCategory(null);
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditCategory({
                                category_id: category.category_id,
                                category_name: category.category_name,
                                category_description: category.category_description ?? "",
                              });
                              setIsEditDialogOpen(true);
                            }}
                            disabled={isLoading || !canWrite}
                            title={!canWrite ? "Read-only role" : undefined}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Category</DialogTitle>
                            <DialogDescription>Make changes to the category details.</DialogDescription>
                          </DialogHeader>
                          {editCategory && (
                            <div className="grid gap-4 py-4">
                              <div className="grid gap-2">
                                <Label htmlFor="edit-name">Category Name</Label>
                                <Input
                                  id="edit-name"
                                  value={editCategory.category_name}
                                  onChange={(e) =>
                                    setEditCategory({ ...editCategory, category_name: e.target.value })
                                  }
                                  disabled={isLoading}
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label htmlFor="edit-description">Short description (optional)</Label>
                                <Textarea
                                  id="edit-description"
                                  value={editCategory.category_description}
                                  onChange={(e) =>
                                    setEditCategory({ ...editCategory, category_description: e.target.value })
                                  }
                                  placeholder="e.g., Plumbing repairs, installs, and maintenance"
                                  rows={2}
                                  maxLength={160}
                                  disabled={isLoading}
                                />
                              </div>
                            </div>
                          )}
                          <DialogFooter>
                            <Button
                              variant="outline"
                              onClick={() => setIsEditDialogOpen(false)}
                              disabled={isLoading}
                            >
                              Cancel
                            </Button>
                            <Button onClick={handleEditCategory} disabled={isLoading}>
                              {isLoading ? "Saving..." : "Save Changes"}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog
                        open={isDeleteDialogOpen && categoryToDelete === category.category_id}
                        onOpenChange={(open) => {
                          setIsDeleteDialogOpen(open);
                          if (!open) setCategoryToDelete(null);
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setCategoryToDelete(category.category_id);
                              setIsDeleteDialogOpen(true);
                            }}
                            disabled={isLoading || !canWrite}
                            title={!canWrite ? "Read-only role" : undefined}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this category? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteCategory} disabled={isLoading}>
                              {isLoading ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}