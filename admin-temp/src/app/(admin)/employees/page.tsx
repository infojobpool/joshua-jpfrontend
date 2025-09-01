// "use client";

// import { useState, useEffect } from "react";
// import { Plus, Pencil, Search } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Toaster } from "@/components/ui/sonner";
// import { toast } from "sonner";
// import axiosInstance from "@/lib/axiosInstance";

// interface AdminUser {
//   user_id: string;
//   full_name: string;
//   email: string;
//   role_id: string;
//   role_name: string;
//   status: boolean;
//   created_at: string;
// }

// interface Role {
//   role_id: string;
//   role_name: string;
//   role_status: boolean;
// }

// export default function AdminUsersPage() {
//   const [users, setUsers] = useState<AdminUser[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [newUser, setNewUser] = useState({
//     full_name: "",
//     email: "",
//     role: "",
//   });
//   const [editUser, setEditUser] = useState<AdminUser | null>(null);
//   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
//   const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [roles, setRoles] = useState<Role[]>([]);

//   const fetchRoles = async () => {
//     try {
//       const response = await axiosInstance.get("/roles/");
//       if (response.data.status_code === 200) {
//         setRoles(response.data.data);
//       } else {
//         toast.error("Failed to fetch roles");
//       }
//     } catch {
//       toast.error("Failed to fetch roles");
//     }
//   };

//   const fetchUsers = async () => {
//     try {
//       setIsLoading(true);
//       const response = await axiosInstance.get("get-admin-users/");
//       if (response.data.status_code === 200) {
//         setUsers(response.data.data);
//       } else {
//         toast.error("Failed to fetch users");
//       }
//     } catch {
//       toast.error("An error occurred while fetching users");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchUsers();
//     fetchRoles();
//   }, []);

//   const filteredUsers = users.filter(
//     (user) =>
//       user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       user.email.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const validateEmail = (email: string) =>
//     /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

//   const handleAddUser = async () => {
//     if (newUser.full_name.trim() === "") {
//       toast.error("Full name is required");
//       return;
//     }
//     if (!validateEmail(newUser.email)) {
//       toast.error("Valid email is required");
//       return;
//     }
//     if (!newUser.role) {
//       toast.error("Role is required");
//       return;
//     }

//     try {
//       setIsLoading(true);
//       const response = await axiosInstance.post("create-admin-user/", {
//         user_fullname: newUser.full_name,
//         user_email: newUser.email,
//         role: newUser.role,
//       });

//       if (response.data.status_code === 201) {
//         toast.success("User created successfully");
//         setNewUser({ full_name: "", email: "", role: "" });
//         setIsAddDialogOpen(false);
//         fetchUsers();
//       } else {
//         toast.error(response.data.message || "Failed to create user");
//       }
//     } catch {
//       toast.error("An error occurred while creating user");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleEditUser = async () => {
//     if (!editUser || editUser.full_name.trim() === "") {
//       toast.error("Full name is required");
//       return;
//     }
//     if (!validateEmail(editUser.email)) {
//       toast.error("Valid email is required");
//       return;
//     }
//     if (!editUser.role_id) {
//       toast.error("Role is required");
//       return;
//     }

//     try {
//       setIsLoading(true);
//       const response = await axiosInstance.put(
//         `update-admin-user/?user_id=${editUser.user_id}`,
//         {
//           user_fullname: editUser.full_name,
//           user_email: editUser.email,
//           role: editUser.role_id,
//           status: editUser.status,
//         }
//       );

//       if (response.data.status_code === 200) {
//         toast.success("User updated successfully");
//         setEditUser(null);
//         setIsEditDialogOpen(false);
//         fetchUsers();
//       } else {
//         toast.error(response.data.message || "Failed to update user");
//       }
//     } catch {
//       toast.error("An error occurred while updating user");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col gap-4">
//       <Toaster />
//       <div className="flex items-center justify-between">
//         <h1 className="text-xl font-semibold">Admin Users Management</h1>
//         <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
//           <DialogTrigger asChild>
//             <Button disabled={isLoading}>
//               <Plus className="mr-2 h-4 w-4" />
//               Add User
//             </Button>
//           </DialogTrigger>
//           <DialogContent>
//             <DialogHeader>
//               <DialogTitle>Add New Admin User</DialogTitle>
//               <DialogDescription>
//                 Create a new admin user for the platform.
//               </DialogDescription>
//             </DialogHeader>
//             <div className="grid gap-4 py-4">
//               <div className="grid gap-2">
//                 <Label htmlFor="full_name">Full Name</Label>
//                 <Input
//                   id="full_name"
//                   value={newUser.full_name}
//                   onChange={(e) =>
//                     setNewUser({ ...newUser, full_name: e.target.value })
//                   }
//                   placeholder="e.g., John Doe"
//                   disabled={isLoading}
//                 />
//               </div>
//               <div className="grid gap-2">
//                 <Label htmlFor="email">Email</Label>
//                 <Input
//                   id="email"
//                   type="email"
//                   value={newUser.email}
//                   onChange={(e) =>
//                     setNewUser({ ...newUser, email: e.target.value })
//                   }
//                   placeholder="e.g., john.doe@example.com"
//                   disabled={isLoading}
//                 />
//               </div>
//               <div className="grid gap-2">
//                 <Label htmlFor="role">Role</Label>
//                 <Select
//                   value={newUser.role}
//                   onValueChange={(value) =>
//                     setNewUser({ ...newUser, role: value })
//                   }
//                   disabled={isLoading || roles.length === 0}
//                 >
//                   <SelectTrigger id="role">
//                     <SelectValue placeholder="Select role" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {roles.map((role) => (
//                       <SelectItem key={role.role_id} value={role.role_id}>
//                         {role.role_name}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>
//             </div>
//             <DialogFooter>
//               <Button
//                 variant="outline"
//                 onClick={() => setIsAddDialogOpen(false)}
//                 disabled={isLoading}
//               >
//                 Cancel
//               </Button>
//               <Button onClick={handleAddUser} disabled={isLoading}>
//                 {isLoading ? "Adding..." : "Add User"}
//               </Button>
//             </DialogFooter>
//           </DialogContent>
//         </Dialog>
//       </div>

//       <div className="flex items-center gap-2">
//         <div className="relative flex-1">
//           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//           <Input
//             type="search"
//             placeholder="Search users..."
//             className="pl-8"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             disabled={isLoading}
//           />
//         </div>
//       </div>

//       <div className="rounded-md border">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Full Name</TableHead>
//               <TableHead>Email</TableHead>
//               <TableHead>Role</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead>Created At</TableHead>
//               <TableHead className="text-right">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {isLoading ? (
//               <TableRow>
//                 <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
//                   Loading...
//                 </TableCell>
//               </TableRow>
//             ) : filteredUsers.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
//                   No users found
//                 </TableCell>
//               </TableRow>
//             ) : (
//               filteredUsers.map((user) => (
//                 <TableRow key={user.user_id}>
//                   <TableCell className="font-medium">{user.full_name}</TableCell>
//                   <TableCell>{user.email}</TableCell>
//                   <TableCell>{user.role_name}</TableCell>
//                   <TableCell>{user.status ? "Inactive" : "Active"}</TableCell>
//                   <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
//                   <TableCell className="text-right">
//                     <Dialog
//                       open={isEditDialogOpen && editUser?.user_id === user.user_id}
//                       onOpenChange={(open) => {
//                         setIsEditDialogOpen(open);
//                         if (!open) setEditUser(null);
//                       }}
//                     >
//                       <DialogTrigger asChild>
//                         <Button
//                           variant="ghost"
//                           size="icon"
//                           onClick={() => {
//                             setEditUser({
//                               user_id: user.user_id,
//                               full_name: user.full_name,
//                               email: user.email,
//                               role_id: user.role_id,
//                               role_name: user.role_name,
//                               status: user.status,
//                               created_at: user.created_at,
//                             });
//                             setIsEditDialogOpen(true);
//                           }}
//                           disabled={isLoading}
//                         >
//                           <Pencil className="h-4 w-4" />
//                           <span className="sr-only">Edit</span>
//                         </Button>
//                       </DialogTrigger>
//                       <DialogContent>
//                         <DialogHeader>
//                           <DialogTitle>Edit Admin User</DialogTitle>
//                           <DialogDescription>Make changes to the admin user details.</DialogDescription>
//                         </DialogHeader>
//                         {editUser && (
//                           <div className="grid gap-4 py-4">
//                             <div className="grid gap-2">
//                               <Label htmlFor="edit-full_name">Full Name</Label>
//                               <Input
//                                 id="edit-full_name"
//                                 value={editUser.full_name}
//                                 onChange={(e) =>
//                                   setEditUser({ ...editUser, full_name: e.target.value })
//                                 }
//                                 disabled={isLoading}
//                               />
//                             </div>
//                             <div className="grid gap-2">
//                               <Label htmlFor="edit-email">Email</Label>
//                               <Input
//                                 id="edit-email"
//                                 type="email"
//                                 value={editUser.email}
//                                 onChange={(e) =>
//                                   setEditUser({ ...editUser, email: e.target.value })
//                                 }
//                                 disabled
//                               />
//                             </div>
//                             <div className="grid gap-2">
//                               <Label htmlFor="edit-role">Role</Label>
//                               <Select
//                                 value={editUser.role_id}
//                                 onValueChange={(value) =>
//                                   setEditUser({ ...editUser, role_id: value })
//                                 }
//                                 disabled={isLoading || roles.length === 0}
//                               >
//                                 <SelectTrigger id="edit-role">
//                                   <SelectValue placeholder="Select role" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                   {roles.map((role) => (
//                                     <SelectItem key={role.role_id} value={role.role_id}>
//                                       {role.role_name}
//                                     </SelectItem>
//                                   ))}
//                                 </SelectContent>
//                               </Select>
//                             </div>
//                             <div className="grid gap-2">
//                               <Label htmlFor="edit-status">Status</Label>
//                               <Select
//                                 value={editUser.status ? "Inactive" : "Active"}
//                                 onValueChange={(value) =>
//                                   setEditUser({ ...editUser, status: value === "Inactive" })
//                                 }
//                                 disabled={isLoading}
//                               >
//                                 <SelectTrigger id="edit-status">
//                                   <SelectValue placeholder="Select status" />
//                                 </SelectTrigger>
//                                 <SelectContent>
//                                   <SelectItem value="Active">Active</SelectItem>
//                                   <SelectItem value="Inactive">Inactive</SelectItem>
//                                 </SelectContent>
//                               </Select>
//                             </div>
//                           </div>
//                         )}
//                         <DialogFooter>
//                           <Button
//                             variant="outline"
//                             onClick={() => setIsEditDialogOpen(false)}
//                             disabled={isLoading}
//                           >
//                             Cancel
//                           </Button>
//                           <Button onClick={handleEditUser} disabled={isLoading}>
//                             {isLoading ? "Saving..." : "Save Changes"}
//                           </Button>
//                         </DialogFooter>
//                       </DialogContent>
//                     </Dialog>
//                   </TableCell>
//                 </TableRow>
//               ))
//             )}
//           </TableBody>
//         </Table>
//       </div>
//     </div>
//   );
// }



"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import axiosInstance from "@/lib/axiosInstance";

interface AdminUser {
  user_id: string;
  full_name: string;
  email: string;
  role_id: string;
  role_name: string;
  status: boolean;
  created_at: string;
}

interface Role {
  role_id: string;
  role_name: string;
  role_status: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newUser, setNewUser] = useState({
    full_name: "",
    email: "",
    role: "",
  });
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }; 

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get("/roles/");
      if (response.data.status_code === 200) {
        setRoles(response.data.data);
      } else {
        toast.error("Failed to fetch roles");
      }
    } catch {
      toast.error("Failed to fetch roles");
    }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("get-admin-users/");
      if (response.data.status_code === 200) {
        setUsers(response.data.data);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch {
      toast.error("An error occurred while fetching users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleAddUser = async () => {
    if (newUser.full_name.trim() === "") {
      toast.error("Full name is required");
      return;
    }
    if (!validateEmail(newUser.email)) {
      toast.error("Valid email is required");
      return;
    }
    if (!newUser.role) {
      toast.error("Role is required");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.post("create-admin-user/", {
        user_fullname: newUser.full_name,
        user_email: newUser.email,
        role: newUser.role,
      });

      if (response.data.status_code === 201) {
        toast.success("User created successfully");
        setNewUser({ full_name: "", email: "", role: "" });
        setIsAddDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(response.data.message || "Failed to create user");
      }
    } catch {
      toast.error("An error occurred while creating user");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = async () => {
    if (!editUser || editUser.full_name.trim() === "") {
      toast.error("Full name is required");
      return;
    }
    if (!validateEmail(editUser.email)) {
      toast.error("Valid email is required");
      return;
    }
    if (!editUser.role_id) {
      toast.error("Role is required");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.put(
        `update-admin-user/?user_id=${editUser.user_id}`,
        {
          user_fullname: editUser.full_name,
          user_email: editUser.email,
          role: editUser.role_id,
          status: editUser.status,
        }
      );

      if (response.data.status_code === 200) {
        toast.success("User updated successfully");
        setEditUser(null);
        setIsEditDialogOpen(false);
        fetchUsers();
      } else {
        toast.error(response.data.message || "Failed to update user");
      }
    } catch {
      toast.error("An error occurred while updating user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Toaster />
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin Users Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading}>
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Admin User</DialogTitle>
              <DialogDescription>
                Create a new admin user for the platform.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={newUser.full_name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, full_name: e.target.value })
                  }
                  placeholder="e.g., John Doe"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                  placeholder="e.g., john.doe@example.com"
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value) =>
                    setNewUser({ ...newUser, role: value })
                  }
                  disabled={isLoading || roles.length === 0}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.role_id} value={role.role_id}>
                        {role.role_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={isLoading}>
                {isLoading ? "Adding..." : "Add User"}
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
            placeholder="Search users..."
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
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role_name}</TableCell>
                  <TableCell>{user.status ? "Inactive" : "Active"}</TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Dialog
                      open={isEditDialogOpen && editUser?.user_id === user.user_id}
                      onOpenChange={(open) => {
                        setIsEditDialogOpen(open);
                        if (!open) setEditUser(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditUser({
                              user_id: user.user_id,
                              full_name: user.full_name,
                              email: user.email,
                              role_id: user.role_id,
                              role_name: user.role_name,
                              status: user.status,
                              created_at: user.created_at,
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
                          <DialogTitle>Edit Admin User</DialogTitle>
                          <DialogDescription>Make changes to the admin user details.</DialogDescription>
                        </DialogHeader>
                        {editUser && (
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="edit-full_name">Full Name</Label>
                              <Input
                                id="edit-full_name"
                                value={editUser.full_name}
                                onChange={(e) =>
                                  setEditUser({ ...editUser, full_name: e.target.value })
                                }
                                disabled={isLoading}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-email">Email</Label>
                              <Input
                                id="edit-email"
                                type="email"
                                value={editUser.email}
                                onChange={(e) =>
                                  setEditUser({ ...editUser, email: e.target.value })
                                }
                                disabled
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-role">Role</Label>
                              <Select
                                value={editUser.role_id}
                                onValueChange={(value) =>
                                  setEditUser({ ...editUser, role_id: value })
                                }
                                disabled={isLoading || roles.length === 0}
                              >
                                <SelectTrigger id="edit-role">
                                  <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roles.map((role) => (
                                    <SelectItem key={role.role_id} value={role.role_id}>
                                      {role.role_name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="edit-status">Status</Label>
                              <Select
                                value={editUser.status ? "Inactive" : "Active"}
                                onValueChange={(value) =>
                                  setEditUser({ ...editUser, status: value === "Inactive" })
                                }
                                disabled={isLoading}
                              >
                                <SelectTrigger id="edit-status">
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Active">Active</SelectItem>
                                  <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                              </Select>
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
                          <Button onClick={handleEditUser} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Changes"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
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