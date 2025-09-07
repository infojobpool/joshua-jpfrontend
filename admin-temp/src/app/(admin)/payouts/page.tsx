// "use client"

// import { useState } from "react"
// import {
//   Search,
//   Download,
//   MoreHorizontal,
//   CheckCircle,
//   XCircle,
//   Clock,
//   AlertCircle,
// } from "lucide-react"
// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table"
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu"
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select"
// import { Badge } from "@/components/ui/badge"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog"
// import { Label } from "@/components/ui/label"

// interface Tasker {
//   id: number
//   name: string
//   email: string
// }

// interface Payout {
//   id: number
//   tasker: Tasker
//   amount: number
//   fee: number
//   netAmount: number
//   status: string
//   method: string
//   reference: string
//   date: string
//   completedDate: string | null
// }

// export default function PayoutsPage() {
//   const [payouts, setPayouts] = useState<Payout[]>([])
//   const [searchTerm, setSearchTerm] = useState("")
//   const [statusFilter, setStatusFilter] = useState("all")
//   const [methodFilter, setMethodFilter] = useState("all")
//   const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null)
//   const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

//   const handleStatusChange = (payoutId: number, newStatus: string) => {
//     setPayouts((prev) =>
//       prev.map((p) =>
//         p.id === payoutId ? { ...p, status: newStatus } : p
//       )
//     )
//   }

//   const filteredPayouts = payouts.filter((payout) => {
//     const matchesSearch =
//       payout.tasker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       payout.tasker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       payout.reference.toLowerCase().includes(searchTerm.toLowerCase())

//     const matchesStatus =
//       statusFilter === "all" ||
//       payout.status.toLowerCase() === statusFilter.toLowerCase()

//     const matchesMethod =
//       methodFilter === "all" ||
//       payout.method.toLowerCase() === methodFilter.toLowerCase()

//     return matchesSearch && matchesStatus && matchesMethod
//   })

//   const totalPending = payouts
//     .filter((p) => p.status === "Pending")
//     .reduce((sum, p) => sum + p.amount, 0)
//     .toFixed(2)
//   const totalProcessing = payouts
//     .filter((p) => p.status === "Processing")
//     .reduce((sum, p) => sum + p.amount, 0)
//     .toFixed(2)
//   const totalCompleted = payouts
//     .filter((p) => p.status === "Completed")
//     .reduce((sum, p) => sum + p.amount, 0)
//     .toFixed(2)
//   const totalFailed = payouts
//     .filter((p) => p.status === "Failed")
//     .reduce((sum, p) => sum + p.amount, 0)
//     .toFixed(2)

//   return (
//     <div className="flex flex-col gap-4">
//       <div className="flex items-center justify-between">
//         <h1 className="text-xl font-semibold">Payouts Management</h1>
//         <Button>
//           <Download className="mr-2 h-4 w-4" />
//           Export
//         </Button>
//       </div>

//       <div className="grid gap-4 md:grid-cols-4">
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Pending</CardTitle>
//             <Clock className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">${totalPending}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Processing</CardTitle>
//             <AlertCircle className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">${totalProcessing}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Completed</CardTitle>
//             <CheckCircle className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">${totalCompleted}</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//             <CardTitle className="text-sm font-medium">Failed</CardTitle>
//             <XCircle className="h-4 w-4 text-muted-foreground" />
//           </CardHeader>
//           <CardContent>
//             <div className="text-2xl font-bold">${totalFailed}</div>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="flex flex-col md:flex-row items-center gap-4">
//         <div className="relative flex-1 w-full">
//           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//           <Input
//             type="search"
//             placeholder="Search payouts..."
//             className="pl-8 w-full"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//           />
//         </div>
//         <div className="flex items-center gap-2 w-full md:w-auto">
//           <Select value={statusFilter} onValueChange={setStatusFilter}>
//             <SelectTrigger className="w-[180px]">
//               <SelectValue placeholder="Filter by status" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Statuses</SelectItem>
//               <SelectItem value="pending">Pending</SelectItem>
//               <SelectItem value="processing">Processing</SelectItem>
//               <SelectItem value="completed">Completed</SelectItem>
//               <SelectItem value="failed">Failed</SelectItem>
//             </SelectContent>
//           </Select>
//           <Select value={methodFilter} onValueChange={setMethodFilter}>
//             <SelectTrigger className="w-[180px]">
//               <SelectValue placeholder="Filter by method" />
//             </SelectTrigger>
//             <SelectContent>
//               <SelectItem value="all">All Methods</SelectItem>
//               <SelectItem value="bank transfer">Bank Transfer</SelectItem>
//               <SelectItem value="paypal">PayPal</SelectItem>
//             </SelectContent>
//           </Select>
//         </div>
//       </div>

//       <div className="rounded-md border">
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead>Tasker</TableHead>
//               <TableHead>Amount</TableHead>
//               <TableHead>Status</TableHead>
//               <TableHead className="hidden md:table-cell">Method</TableHead>
//               <TableHead className="hidden md:table-cell">Date</TableHead>
//               <TableHead className="text-right">Actions</TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {filteredPayouts.length === 0 ? (
//               <TableRow>
//                 <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
//                   No payouts found
//                 </TableCell>
//               </TableRow>
//             ) : (
//               filteredPayouts.map((payout) => (
//                 <TableRow key={payout.id}>
//                   <TableCell>
//                     <div className="flex items-center gap-3">
//                       <Avatar>
//                         <AvatarImage src={`/images/placeholder.svg`} alt={payout.tasker.name} />
//                         <AvatarFallback>
//                           {payout.tasker.name.split(" ").map((n) => n[0]).join("")}
//                         </AvatarFallback>
//                       </Avatar>
//                       <div>
//                         <div className="font-medium">{payout.tasker.name}</div>
//                         <div className="text-sm text-muted-foreground">{payout.tasker.email}</div>
//                       </div>
//                     </div>
//                   </TableCell>
//                   <TableCell>
//                     <div className="font-medium">${payout.amount.toFixed(2)}</div>
//                     <div className="text-sm text-muted-foreground">Net: ${payout.netAmount.toFixed(2)}</div>
//                   </TableCell>
//                   <TableCell>
//                     <Badge
//                       variant={
//                         payout.status === "Completed"
//                           ? "default"
//                           : payout.status === "Pending"
//                           ? "outline"
//                           : payout.status === "Processing"
//                           ? "secondary"
//                           : "destructive"
//                       }
//                     >
//                       {payout.status}
//                     </Badge>
//                   </TableCell>
//                   <TableCell className="hidden md:table-cell">{payout.method}</TableCell>
//                   <TableCell className="hidden md:table-cell">{payout.date}</TableCell>
//                   <TableCell className="text-right">
//                     <Dialog
//                       open={isDetailsDialogOpen && selectedPayout?.id === payout.id}
//                       onOpenChange={(open) => {
//                         setIsDetailsDialogOpen(open)
//                         if (!open) setSelectedPayout(null)
//                       }}
//                     >
//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <Button variant="ghost" size="icon">
//                             <MoreHorizontal className="h-4 w-4" />
//                             <span className="sr-only">Open menu</span>
//                           </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end">
//                           <DropdownMenuLabel>Actions</DropdownMenuLabel>
//                           <DropdownMenuItem
//                             onClick={() => {
//                               setSelectedPayout(payout)
//                               setIsDetailsDialogOpen(true)
//                             }}
//                           >
//                             View Details
//                           </DropdownMenuItem>
//                           {payout.status === "Pending" && (
//                             <>
//                               <DropdownMenuSeparator />
//                               <DropdownMenuItem onClick={() => handleStatusChange(payout.id, "Processing")}>
//                                 Process Payout
//                               </DropdownMenuItem>
//                               <DropdownMenuItem
//                                 className="text-destructive"
//                                 onClick={() => handleStatusChange(payout.id, "Failed")}
//                               >
//                                 Cancel Payout
//                               </DropdownMenuItem>
//                             </>
//                           )}
//                           {payout.status === "Failed" && (
//                             <>
//                               <DropdownMenuSeparator />
//                               <DropdownMenuItem onClick={() => handleStatusChange(payout.id, "Pending")}>
//                                 Retry Payout
//                               </DropdownMenuItem>
//                             </>
//                           )}
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                       <DialogContent className="sm:max-w-[425px]">
//                         <DialogHeader>
//                           <DialogTitle>Payout Details</DialogTitle>
//                           <DialogDescription>Complete information about this payout.</DialogDescription>
//                         </DialogHeader>
//                         {selectedPayout && (
//                           <div className="grid gap-4 py-4">
//                             <div className="flex items-center gap-4">
//                               <Avatar className="h-12 w-12">
//                                 <AvatarImage src={`/images/placeholder.svg`} alt={selectedPayout.tasker.name} />
//                                 <AvatarFallback>
//                                   {selectedPayout.tasker.name
//                                     .split(" ")
//                                     .map((n) => n[0])
//                                     .join("")}
//                                 </AvatarFallback>
//                               </Avatar>
//                               <div>
//                                 <h3 className="font-medium">{selectedPayout.tasker.name}</h3>
//                                 <p className="text-sm text-muted-foreground">{selectedPayout.tasker.email}</p>
//                               </div>
//                             </div>
//                             <div className="grid grid-cols-2 gap-4">
//                               <div>
//                                 <Label>Amount</Label>
//                                 <div className="font-medium">${selectedPayout.amount.toFixed(2)}</div>
//                               </div>
//                               <div>
//                                 <Label>Status</Label>
//                                 <Badge
//                                   variant={
//                                     selectedPayout.status === "Completed"
//                                       ? "default"
//                                       : selectedPayout.status === "Pending"
//                                       ? "outline"
//                                       : selectedPayout.status === "Processing"
//                                       ? "secondary"
//                                       : "destructive"
//                                   }
//                                 >
//                                   {selectedPayout.status}
//                                 </Badge>
//                               </div>
//                             </div>
//                             <div className="grid grid-cols-2 gap-4">
//                               <div>
//                                 <Label>Fee</Label>
//                                 <div className="font-medium">${selectedPayout.fee.toFixed(2)}</div>
//                               </div>
//                               <div>
//                                 <Label>Net Amount</Label>
//                                 <div className="font-medium">${selectedPayout.netAmount.toFixed(2)}</div>
//                               </div>
//                             </div>
//                             <div className="grid grid-cols-2 gap-4">
//                               <div>
//                                 <Label>Method</Label>
//                                 <div>{selectedPayout.method}</div>
//                               </div>
//                               <div>
//                                 <Label>Reference</Label>
//                                 <div className="font-mono text-sm">{selectedPayout.reference}</div>
//                               </div>
//                             </div>
//                             <div className="grid grid-cols-2 gap-4">
//                               <div>
//                                 <Label>Request Date</Label>
//                                 <div>{selectedPayout.date}</div>
//                               </div>
//                               <div>
//                                 <Label>Completed Date</Label>
//                                 <div>{selectedPayout.completedDate || "N/A"}</div>
//                               </div>
//                             </div>
//                           </div>
//                         )}
//                         <DialogFooter>
//                           <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
//                             Close
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
//   )
// }

// "use client";

// import { useState, useEffect } from "react";
// import axios from "axios";
// import {
//   Search,
//   Download,
//   MoreHorizontal,
//   CheckCircle,
//   XCircle,
//   Clock,
//   AlertCircle,
// } from "lucide-react";
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
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Badge } from "@/components/ui/badge";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Label } from "@/components/ui/label";
// import axiosInstance from "@/lib/axiosInstance";

// interface Tasker {
//   id: number;
//   name: string;
//   email: string;
// }

// interface Payout {
//   id: number;
//   tasker: Tasker;
//   amount: number;
//   fee: number;
//   netAmount: number;
//   status: string;
//   method: string;
//   reference: string;
//   date: string;
//   completedDate: string | null;
// }

// export default function PayoutsPage() {
//   const [payouts, setPayouts] = useState<Payout[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [statusFilter, setStatusFilter] = useState("all");
//   const [methodFilter, setMethodFilter] = useState("all");
//   const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
//   const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Map backend status codes to frontend status strings
//   const statusMap: { [key: number]: string } = {
//     "-1": "Pending",
//     0: "Processing",
//     1: "Completed",
//     2: "Failed",
//   };

//   // Fetch payouts from the backend
//   useEffect(() => {
//   const fetchPayouts = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
//       const response = await axiosInstance.get("get-all-task-orders/");

//       if (response.data.status_code !== 200) {
//         throw new Error(response.data.message);
//       }

//       const fetchedPayouts: Payout[] = response.data.data.task_orders.map(
//         (order: {
//           order_id: number;
//           tasker_id: string;
//           bid_amount: string;
//           gst: string;
//           commission: string;
//           payable_amount: string;
//           status: number;
//           method?: string;
//           payment_id?: string;
//           created_at?: string;
//           completed_at?: string | null;
//         }) => ({
//           id: order.order_id,
//           tasker: {
//             id: parseInt(order.tasker_id),
//             name: `${order.tasker_id}`,
//           },
//           amount: parseFloat(order.bid_amount) || 0,
//           fee: (parseFloat(order.gst) || 0) + (parseFloat(order.commission) || 0),
//           netAmount: parseFloat(order.payable_amount) || 0,
//           status: statusMap[order.status] || "Unknown",
//           method: order.method || "Bank Transfer",
//           reference: order.payment_id || `REF-${order.order_id}`,
//           date: order.created_at || new Date().toISOString().split("T")[0],
//           completedDate: order.completed_at || null,
//         })
//       );

//       setPayouts(fetchedPayouts);
//     } catch (_error: unknown) {
//       setError("Failed to fetch payouts");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   fetchPayouts();
// }, [statusMap]); // Added statusMap to dependency array

//   const handleStatusChange = async (payoutId: number, newStatus: string) => {
//     try {
//       // Map frontend status back to backend status code
//       const reverseStatusMap: { [key: string]: number } = {
//         Pending: -1,
//         Processing: 0,
//         Completed: 1,
//         Failed: 2,
//       };
//       const statusCode = reverseStatusMap[newStatus];
//       await axios.patch(`http://localhost:8000/task-order/${payoutId}/status`, {
//         status: statusCode,
//       });
//       setPayouts((prev) =>
//         prev.map((p) => (p.id === payoutId ? { ...p, status: newStatus } : p))
//       );
//     } catch (err: unknown) {
//       setError("Failed to update payout status");
//     }
//   };

//   const filteredPayouts = payouts.filter((payout) => {
//     const matchesSearch =
//       payout.tasker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       payout.tasker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       payout.reference.toLowerCase().includes(searchTerm.toLowerCase());

//     const matchesStatus =
//       statusFilter === "all" ||
//       payout.status.toLowerCase() === statusFilter.toLowerCase();

//     const matchesMethod =
//       methodFilter === "all" ||
//       payout.method.toLowerCase() === methodFilter.toLowerCase();

//     return matchesSearch && matchesStatus && matchesMethod;
//   });

//   const totalPending = payouts
//     .filter((p) => p.status === "Pending")
//     .reduce((sum, p) => sum + p.amount, 0)
//     .toFixed(2);
//   const totalProcessing = payouts
//     .filter((p) => p.status === "Processing")
//     .reduce((sum, p) => sum + p.amount, 0)
//     .toFixed(2);
//   const totalCompleted = payouts
//     .filter((p) => p.status === "Completed")
//     .reduce((sum, p) => sum + p.amount, 0)
//     .toFixed(2);
//   const totalFailed = payouts
//     .filter((p) => p.status === "Failed")
//     .reduce((sum, p) => sum + p.amount, 0)
//     .toFixed(2);

//   return (
//     <div className="flex flex-col gap-4">
//       <div className="flex items-center justify-between">
//         <h1 className="text-xl font-semibold">Payouts Management</h1>
//         <Button disabled={isLoading}>
//           <Download className="mr-2 h-4 w-4" />
//           Export
//         </Button>
//       </div>

//       {isLoading ? (
//         <div className="text-center py-8">Loading...</div>
//       ) : error ? (
//         <div className="text-center py-8 text-destructive">{error}</div>
//       ) : (
//         <>
//           <div className="grid gap-4 md:grid-cols-4">
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Pending</CardTitle>
//                 <Clock className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">${totalPending}</div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">
//                   Processing
//                 </CardTitle>
//                 <AlertCircle className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">${totalProcessing}</div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Completed</CardTitle>
//                 <CheckCircle className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">${totalCompleted}</div>
//               </CardContent>
//             </Card>
//             <Card>
//               <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//                 <CardTitle className="text-sm font-medium">Failed</CardTitle>
//                 <XCircle className="h-4 w-4 text-muted-foreground" />
//               </CardHeader>
//               <CardContent>
//                 <div className="text-2xl font-bold">${totalFailed}</div>
//               </CardContent>
//             </Card>
//           </div>

//           <div className="flex flex-col md:flex-row items-center gap-4">
//             <div className="relative flex-1 w-full">
//               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
//               <Input
//                 type="search"
//                 placeholder="Search payouts..."
//                 className="pl-8 w-full"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//             <div className="flex items-center gap-2 w-full md:w-auto">
//               <Select value={statusFilter} onValueChange={setStatusFilter}>
//                 <SelectTrigger className="w-[180px]">
//                   <SelectValue placeholder="Filter by status" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Statuses</SelectItem>
//                   <SelectItem value="pending">Pending</SelectItem>
//                   <SelectItem value="processing">Processing</SelectItem>
//                   <SelectItem value="completed">Completed</SelectItem>
//                   <SelectItem value="failed">Failed</SelectItem>
//                 </SelectContent>
//               </Select>
//               <Select value={methodFilter} onValueChange={setMethodFilter}>
//                 <SelectTrigger className="w-[180px]">
//                   <SelectValue placeholder="Filter by method" />
//                 </SelectTrigger>
//                 <SelectContent>
//                   <SelectItem value="all">All Methods</SelectItem>
//                   <SelectItem value="bank transfer">Bank Transfer</SelectItem>
//                   <SelectItem value="paypal">PayPal</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>
//           </div>

//           <div className="rounded-md border">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Tasker</TableHead>
//                   <TableHead>Amount</TableHead>
//                   <TableHead>Status</TableHead>
//                   <TableHead className="hidden md:table-cell">Method</TableHead>
//                   <TableHead className="hidden md:table-cell">Date</TableHead>
//                   <TableHead className="text-right">Actions</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredPayouts.length === 0 ? (
//                   <TableRow>
//                     <TableCell
//                       colSpan={6}
//                       className="text-center py-8 text-muted-foreground"
//                     >
//                       No payouts found
//                     </TableCell>
//                   </TableRow>
//                 ) : (
//                   filteredPayouts.map((payout) => (
//                     <TableRow key={payout.id}>
//                       <TableCell>
//                         <div className="flex items-center gap-3">
//                           <Avatar>
//                             <AvatarImage
//                               src={`/images/placeholder.svg`}
//                               alt={payout.tasker.name}
//                             />
//                             <AvatarFallback>
//                               {payout.tasker.name
//                                 .split(" ")
//                                 .map((n) => n[0])
//                                 .join("")}
//                             </AvatarFallback>
//                           </Avatar>
//                           <div>
//                             <div className="font-medium">
//                               {payout.tasker.name}
//                             </div>
//                             <div className="text-sm text-muted-foreground">
//                               {payout.tasker.email}
//                             </div>
//                           </div>
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         <div className="font-medium">
//                           INR {payout.amount.toFixed(2)}
//                         </div>
//                         <div className="text-sm text-muted-foreground">
//                           Net: INR {payout.netAmount.toFixed(2)}
//                         </div>
//                       </TableCell>
//                       <TableCell>
//                         <Badge
//                           variant={
//                             payout.status === "Completed"
//                               ? "default"
//                               : payout.status === "Pending"
//                               ? "outline"
//                               : payout.status === "Processing"
//                               ? "secondary"
//                               : "destructive"
//                           }
//                         >
//                           {payout.status}
//                         </Badge>
//                       </TableCell>
//                       <TableCell className="hidden md:table-cell">
//                         {payout.method}
//                       </TableCell>
//                       <TableCell className="hidden md:table-cell">
//                         {payout.date}
//                       </TableCell>
//                       <TableCell className="text-right">
//                         <Dialog
//                           open={
//                             isDetailsDialogOpen &&
//                             selectedPayout?.id === payout.id
//                           }
//                           onOpenChange={(open) => {
//                             setIsDetailsDialogOpen(open);
//                             if (!open) setSelectedPayout(null);
//                           }}
//                         >
//                           <DropdownMenu>
//                             <DropdownMenuTrigger asChild>
//                               <Button variant="ghost" size="icon">
//                                 <MoreHorizontal className="h-4 w-4" />
//                                 <span className="sr-only">Open menu</span>
//                               </Button>
//                             </DropdownMenuTrigger>
//                             <DropdownMenuContent align="end">
//                               <DropdownMenuLabel>Actions</DropdownMenuLabel>
//                               <DropdownMenuItem
//                                 onClick={() => {
//                                   setSelectedPayout(payout);
//                                   setIsDetailsDialogOpen(true);
//                                 }}
//                               >
//                                 View Details
//                               </DropdownMenuItem>
//                               {payout.status === "Pending" && (
//                                 <>
//                                   <DropdownMenuSeparator />
//                                   <DropdownMenuItem
//                                     onClick={() =>
//                                       handleStatusChange(
//                                         payout.id,
//                                         "Processing"
//                                       )
//                                     }
//                                   >
//                                     Process Payout
//                                   </DropdownMenuItem>
//                                   <DropdownMenuItem
//                                     className="text-destructive"
//                                     onClick={() =>
//                                       handleStatusChange(payout.id, "Failed")
//                                     }
//                                   >
//                                     Cancel Payout
//                                   </DropdownMenuItem>
//                                 </>
//                               )}
//                               {payout.status === "Failed" && (
//                                 <>
//                                   <DropdownMenuSeparator />
//                                   <DropdownMenuItem
//                                     onClick={() =>
//                                       handleStatusChange(payout.id, "Pending")
//                                     }
//                                   >
//                                     Retry Payout
//                                   </DropdownMenuItem>
//                                 </>
//                               )}
//                             </DropdownMenuContent>
//                           </DropdownMenu>
//                           <DialogContent className="sm:max-w-[425px]">
//                             <DialogHeader>
//                               <DialogTitle>Payout Details</DialogTitle>
//                               <DialogDescription>
//                                 Complete information about this payout.
//                               </DialogDescription>
//                             </DialogHeader>
//                             {selectedPayout && (
//                               <div className="grid gap-4 py-4">
//                                 <div className="flex items-center gap-4">
//                                   <Avatar className="h-12 w-12">
//                                     <AvatarImage
//                                       src={`/images/placeholder.svg`}
//                                       alt={selectedPayout.tasker.name}
//                                     />
//                                     <AvatarFallback>
//                                       {selectedPayout.tasker.name
//                                         .split(" ")
//                                         .map((n) => n[0])
//                                         .join("")}
//                                     </AvatarFallback>
//                                   </Avatar>
//                                   <div>
//                                     <h3 className="font-medium">
//                                       {selectedPayout.tasker.name}
//                                     </h3>
//                                     <p className="text-sm text-muted-foreground">
//                                       {selectedPayout.tasker.email}
//                                     </p>
//                                   </div>
//                                 </div>
//                                 <div className="grid grid-cols-2 gap-4">
//                                   <div>
//                                     <Label>Amount</Label>
//                                     <div className="font-medium">
//                                       ${selectedPayout.amount.toFixed(2)}
//                                     </div>
//                                   </div>
//                                   <div>
//                                     <Label>Status</Label>
//                                     <Badge
//                                       variant={
//                                         selectedPayout.status === "Completed"
//                                           ? "default"
//                                           : selectedPayout.status === "Pending"
//                                           ? "outline"
//                                           : selectedPayout.status ===
//                                             "Processing"
//                                           ? "secondary"
//                                           : "destructive"
//                                       }
//                                     >
//                                       {selectedPayout.status}
//                                     </Badge>
//                                   </div>
//                                 </div>
//                                 <div className="grid grid-cols-2 gap-4">
//                                   <div>
//                                     <Label>Fee</Label>
//                                     <div className="font-medium">
//                                       ${selectedPayout.fee.toFixed(2)}
//                                     </div>
//                                   </div>
//                                   <div>
//                                     <Label>Net Amount</Label>
//                                     <div className="font-medium">
//                                       ${selectedPayout.netAmount.toFixed(2)}
//                                     </div>
//                                   </div>
//                                 </div>
//                                 <div className="grid grid-cols-2 gap-4">
//                                   <div>
//                                     <Label>Method</Label>
//                                     <div>{selectedPayout.method}</div>
//                                   </div>
//                                   <div>
//                                     <Label>Reference</Label>
//                                     <div className="font-mono text-sm">
//                                       {selectedPayout.reference}
//                                     </div>
//                                   </div>
//                                 </div>
//                                 <div className="grid grid-cols-2 gap-4">
//                                   <div>
//                                     <Label>Request Date</Label>
//                                     <div>{selectedPayout.date}</div>
//                                   </div>
//                                   <div>
//                                     <Label>Completed Date</Label>
//                                     <div>
//                                       {selectedPayout.completedDate || "N/A"}
//                                     </div>
//                                   </div>
//                                 </div>
//                               </div>
//                             )}
//                             <DialogFooter>
//                               <Button
//                                 variant="outline"
//                                 onClick={() => setIsDetailsDialogOpen(false)}
//                               >
//                                 Close
//                               </Button>
//                             </DialogFooter>
//                           </DialogContent>
//                         </Dialog>
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 )}
//               </TableBody>
//             </Table>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }

"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Download,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/lib/axiosInstance";

interface Tasker {
  id: number;
  name: string;
  email: string;
}

interface Poster {
  id: number;
  name: string;
  email: string;
}

interface Payout {
  id: number;
  tasker: Tasker;
  poster: Poster;
  amount: number;
  fee: number;
  netAmount: number;
  status: string;
  method: string;
  reference: string;
  date: string;
  completedDate: string | null;
}

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usersById, setUsersById] = useState<Record<string, any>>({});
  const [bankCache, setBankCache] = useState<Record<string, any>>({});

  // Load user details once for bank_info lookups
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await axiosInstance.get("all-user-details/");
        const rows = res.data?.data || res.data || [];
        const map: Record<string, any> = {};
        rows.forEach((u: any) => {
          if (u?.user_id != null) map[String(u.user_id)] = u;
        });
        setUsersById(map);
      } catch (e) {
        // non-blocking
      }
    };
    loadUsers();
  }, []);

  // Helper to resolve a user's bank info using several fallbacks
  const resolveBankInfo = (party: { id: any; name: string; email?: string }) => {
    const cacheKey = String(party.id || party.email || party.name);
    if (bankCache[cacheKey]) return bankCache[cacheKey];
    const byId = usersById[String(party.id)];
    if (byId?.bank_info) return byId.bank_info;
    const list = Object.values(usersById) as any[];
    const byEmail = list.find((u) => party.email && u.user_email === party.email);
    if (byEmail?.bank_info) return byEmail.bank_info;
    const byName = list.find((u) => u.user_fullname === party.name);
    if (byName?.bank_info) return byName.bank_info;
    return {} as any;
  };

  // Attempt network fetch for bank info when local match fails
  const ensureBankInfo = async (party: { id: any; name: string; email?: string }) => {
    const existing = resolveBankInfo(party);
    const hasData = existing && (existing.bank_account_number || existing.account_number || existing.ifsc_code || existing.ifsc || existing.bank_name || existing.upi_id);
    if (hasData) return;
    try {
      if (party.id != null) {
        const res = await axiosInstance.get(`/profile?user_id=${party.id}`);
        const b = res.data?.bank_info || res.data?.data?.bank_info || {};
        const key = String(party.id || party.email || party.name);
        setBankCache((prev) => ({ ...prev, [key]: b }));
      }
    } catch {}
  };

  // Export payouts (visible/filtered) to CSV
  const exportToCSV = (rows: Payout[]) => {
    try {
      const headers = [
        "Tasker",
        "Poster",
        "Amount",
        "NetAmount",
        "Status",
        "Method",
        "Date",
      ];
      const lines = rows.map((p) => [
        p.tasker.name,
        p.poster.name,
        p.amount.toFixed(2),
        (p.amount * 0.742).toFixed(2), // placeholder if net not provided
        p.status,
        p.method,
        p.date,
      ]);
      const csv = [headers, ...lines]
        .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
        .join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date();
      const stamp = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`;
      a.download = `payouts-${stamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("CSV export failed", e);
    }
  };

  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Map backend status codes to frontend status strings
  const statusMap: { [key: number]: string } = {
    "-1": "Pending",
    0: "Processing",
    1: "Completed",
    2: "Failed",
  };

  // Fetch payouts from the backend
  useEffect(() => {
    const fetchPayouts = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axiosInstance.get("get-all-task-orders/");

        if (response.data.status_code !== 200) {
          throw new Error(response.data.message || "Failed to fetch payouts");
        }

        const fetchedPayouts: Payout[] = response.data.data.task_orders.map(
          (order: {
            order_id: number;
            tasker_id: string;
            tasker_name: string;
            poster_id: string;
            poster_name: string;
            bid_amount: string;
            gst: string;
            commission: string;
            payable_amount: string;
            status: number;
            method?: string;
            payment_id?: string;
            created_at?: string;
            completed_at?: string | null;
          }) => ({
            id: order.order_id,
            tasker: {
              id: parseInt(order.tasker_id),
              name: `${order.tasker_name}`, // Fallback name
              email: `tasker${order.tasker_id}@example.com`, // Fallback email
            },
            poster: {
              id: parseInt(order.poster_id),
              name: `${order.poster_name}`, // Fallback name
              email: `tasker${order.poster_id}@example.com`, // Fallback email
            },
            amount: parseFloat(order.bid_amount) || 0,
            fee:
              (parseFloat(order.gst) || 0) +
              (parseFloat(order.commission) || 0),
            netAmount: parseFloat(order.payable_amount) || 0,
            status: statusMap[order.status] || "Unknown",
            method: order.method || "Bank Transfer",
            reference: order.payment_id || `REF-${order.order_id}`,
            date: order.created_at || new Date().toISOString().split("T")[0],
            completedDate: order.completed_at || null,
          })
        );

        setPayouts(fetchedPayouts);
      } catch {
        setError("Failed to fetch payouts. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPayouts();
  }, []); // Empty dependency array to prevent infinite loop

  const handleStatusChange = async (payoutId: number, newStatus: string) => {
    try {
      const reverseStatusMap: { [key: string]: number } = {
        Pending: -1,
        Processing: 0,
        Completed: 1,
        Failed: 2,
      };
      const statusCode = reverseStatusMap[newStatus];
      await axiosInstance.patch(`/task-order/${payoutId}/status`, {
        status: statusCode,
      });
      setPayouts((prev) =>
        prev.map((p) => (p.id === payoutId ? { ...p, status: newStatus } : p))
      );
    } catch {
      setError("Failed to update payout status");
    }
  };

  const filteredPayouts = payouts.filter((payout) => {
    const matchesSearch =
      payout.tasker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.tasker.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payout.reference.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      payout.status.toLowerCase() === statusFilter.toLowerCase();

    const matchesMethod =
      methodFilter === "all" ||
      payout.method.toLowerCase() === methodFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesMethod;
  });

  const totalPending = payouts
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + p.amount, 0)
    .toFixed(2);
  const totalProcessing = payouts
    .filter((p) => p.status === "Processing")
    .reduce((sum, p) => sum + p.amount, 0)
    .toFixed(2);
  const totalCompleted = payouts
    .filter((p) => p.status === "Completed")
    .reduce((sum, p) => sum + p.amount, 0)
    .toFixed(2);
  const totalFailed = payouts
    .filter((p) => p.status === "Failed")
    .reduce((sum, p) => sum + p.amount, 0)
    .toFixed(2);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Payouts Management</h1>
        <Button
          disabled={isLoading}
          onClick={() => {
            // Apply current filters to export only visible rows
            const filtered = payouts
              .filter((p) =>
                `${p.tasker.name} ${p.poster.name}`.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .filter((p) => (statusFilter === "all" ? true : p.status.toLowerCase() === statusFilter))
              .filter((p) => (methodFilter === "all" ? true : p.method.toLowerCase() === methodFilter));
            exportToCSV(filtered);
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : error ? (
        <div className="text-center py-8 text-destructive">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">INR {totalPending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Processing
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">INR {totalProcessing}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">INR {totalCompleted}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed</CardTitle>
                <XCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">INR {totalFailed}</div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search payouts..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="bank transfer">Bank Transfer</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tasker</TableHead>
                  <TableHead>Poster</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">Method</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No payouts found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {payout.tasker.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {payout.tasker.name}
                            </div>
                            {/* <div className="text-sm text-muted-foreground">{payout.tasker.email}</div> */}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {payout.poster.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {payout.poster.name}
                            </div>
                            {/* <div className="text-sm text-muted-foreground">{payout.tasker.email}</div> */}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          INR {payout.amount.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Net: INR {payout.netAmount.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payout.status === "Completed"
                              ? "default"
                              : payout.status === "Pending"
                              ? "outline"
                              : payout.status === "Processing"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {payout.method}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {formatDate(payout.date)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog
                          open={
                            isDetailsDialogOpen &&
                            selectedPayout?.id === payout.id
                          }
                          onOpenChange={(open) => {
                            setIsDetailsDialogOpen(open);
                            if (!open) setSelectedPayout(null);
                          }}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedPayout(payout);
                                  // try to hydrate bank details on demand
                                  ensureBankInfo(payout.tasker);
                                  ensureBankInfo(payout.poster);
                                  setIsDetailsDialogOpen(true);
                                }}
                              >
                                View Details
                              </DropdownMenuItem>
                              {payout.status === "Pending" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(
                                        payout.id,
                                        "Processing"
                                      )
                                    }
                                  >
                                    Process Payout
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      handleStatusChange(payout.id, "Failed")
                                    }
                                  >
                                    Cancel Payout
                                  </DropdownMenuItem>
                                </>
                              )}
                              {payout.status === "Failed" && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleStatusChange(payout.id, "Pending")
                                    }
                                  >
                                    Retry Payout
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                              <DialogTitle>Payout Details</DialogTitle>
                              <DialogDescription>
                                Complete information about this payout.
                              </DialogDescription>
                            </DialogHeader>
                            {selectedPayout && (
                              <div className="grid gap-4 py-4">
                                <div className="flex items-center gap-4">
                                  <Avatar className="h-12 w-12">
                                    <AvatarFallback>
                                      {selectedPayout.tasker.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <h3 className="font-medium">
                                      {selectedPayout.tasker.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedPayout.tasker.email}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Amount</Label>
                                    <div className="font-medium">
                                      INR {selectedPayout.amount.toFixed(2)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <Badge
                                      variant={
                                        selectedPayout.status === "Completed"
                                          ? "default"
                                          : selectedPayout.status === "Pending"
                                          ? "outline"
                                          : selectedPayout.status ===
                                            "Processing"
                                          ? "secondary"
                                          : "destructive"
                                      }
                                    >
                                      {selectedPayout.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Fee</Label>
                                    <div className="font-medium">
                                      INR {selectedPayout.fee.toFixed(2)}
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Net Amount</Label>
                                    <div className="font-medium">
                                      INR {selectedPayout.netAmount.toFixed(2)}
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Method</Label>
                                    <div>{selectedPayout.method}</div>
                                  </div>
                                  <div>
                                    <Label>Reference</Label>
                                    <div className="font-mono text-sm">
                                      {selectedPayout.reference}
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Request Date</Label>
                                    <div>{formatDate(selectedPayout.date)}</div>
                                  </div>
                                  <div>
                                    <Label>Completed Date</Label>
                                    <div>
                                      {selectedPayout.completedDate
                                        ? formatDate(
                                            selectedPayout.completedDate
                                          )
                                        : "N/A"}
                                    </div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="rounded-lg border p-4">
                                    <h4 className="font-semibold mb-2">Tasker Bank</h4>
                                    {(() => {
                                      const data = resolveBankInfo(selectedPayout.tasker) || {};
                                      console.log('Tasker bank data:', data, 'for user:', selectedPayout.tasker);
                                      return (
                                        <div className="text-sm space-y-1">
                                          <div>Account: <span className="font-medium">{data.bank_account_number || data.account_number || "—"}</span></div>
                                          <div>IFSC: <span className="font-medium">{data.ifsc_code || data.ifsc || "—"}</span></div>
                                          <div>Bank: <span className="font-medium">{data.bank_name || "—"}</span></div>
                                          <div>UPI: <span className="font-medium">{data.upi_id || "—"}</span></div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                  <div className="rounded-lg border p-4">
                                    <h4 className="font-semibold mb-2">Poster Bank</h4>
                                    {(() => {
                                      const data = resolveBankInfo(selectedPayout.poster) || {};
                                      console.log('Poster bank data:', data, 'for user:', selectedPayout.poster);
                                      return (
                                        <div className="text-sm space-y-1">
                                          <div>Account: <span className="font-medium">{data.bank_account_number || data.account_number || "—"}</span></div>
                                          <div>IFSC: <span className="font-medium">{data.ifsc_code || data.ifsc || "—"}</span></div>
                                          <div>Bank: <span className="font-medium">{data.bank_name || "—"}</span></div>
                                          <div>UPI: <span className="font-medium">{data.upi_id || "—"}</span></div>
                                        </div>
                                      );
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setIsDetailsDialogOpen(false)}
                              >
                                Close
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
        </>
      )}
    </div>
  );
}
