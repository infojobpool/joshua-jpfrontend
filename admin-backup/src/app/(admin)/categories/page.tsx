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
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosInstance";

interface Category {
  category_id: string;
  category_name: string;
  status: boolean;
  created_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [editCategory, setEditCategory] = useState<null | { category_id: string; category_name: string }>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<null | string>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
        setCategories(response.data.data);
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

  const filteredCategories = categories.filter(
    (category) =>
      category.category_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleAddCategory = async () => {
    if (newCategory.name.trim() === "") {
      toast.error("Category name is required");
      return;
    }
  
    try {
      setIsLoading(true);
      const response = await axiosInstance.post("create-category/", {
        category_name: newCategory.name,
      });
  
      if (response.data.status_code === 201) {
        toast.success("Category created successfully");
        setNewCategory({ name: "" });
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
    if (!editCategory || editCategory.category_name.trim() === "") {
      toast.error("Category name is required");
      return;
    }
  
    try {
      setIsLoading(true);
      const response = await axiosInstance.put(`update-category/${editCategory.category_id}/`, {
        category_name: editCategory.category_name,
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
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading}>
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
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              filteredCategories.map((category) => (
                <TableRow key={category.category_id}>
                  <TableCell className="font-medium">{category.category_name}</TableCell>
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
                              });
                              setIsEditDialogOpen(true);
                            }}
                            disabled={isLoading}
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
                            disabled={isLoading}
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