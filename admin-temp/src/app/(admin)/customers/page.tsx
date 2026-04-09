// "use client";

// import { useState, useEffect } from "react";
// import { Search, Eye, EyeOff, CreditCard, Phone } from "lucide-react";
// import axiosInstance from "@/lib/axiosInstance";
// import { toast } from "sonner";

// interface BankInfo {
//   bank_account_number: string;
//   ifsc_code: string;
// }

// interface Customer {
//   user_id: string;
//   user_fullname: string;
//   user_email: string;
//   phone_number?: string; // Added mobile number field
//   tasker: boolean;
//   task_manager: boolean;
//   status: boolean;
//   verification_status: number;
//   bank_info: BankInfo | null;
// }

// export default function CustomersPage() {
//   const [customers, setCustomers] = useState<Customer[]>([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [visibleBankDetails, setVisibleBankDetails] = useState<Set<string>>(new Set());
//   const [error, setError] = useState<string>("");

//    const fetchCustomers = async () => {
//     try {
//       setIsLoading(true);
//       const response = await axiosInstance.get("all-user-details/");
//       setCustomers(response.data);
//     } catch {
//       toast.error("An error occurred while fetching customers");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCustomers();
//   }, []);

//   const filteredCustomers = customers.filter(
//     (customer) =>
//       customer.user_fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       customer.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
//       (customer.phone_number && customer.phone_number.includes(searchTerm))
//   );

//   const toggleBankDetails = (userId: string) => {
//     const newVisibleBankDetails = new Set(visibleBankDetails);
//     if (newVisibleBankDetails.has(userId)) {
//       newVisibleBankDetails.delete(userId);
//     } else {
//       newVisibleBankDetails.add(userId);
//     }
//     setVisibleBankDetails(newVisibleBankDetails);
//   };

//   const getVerificationStatus = (status: number) => {
//     const statusConfig: Record<number, { text: string; color: string }> = {
//       0: { text: "Pending Verification", color: "bg-yellow-100 text-yellow-800" },
//       2: { text: "Pending Bank Verification", color: "bg-orange-100 text-orange-800" },
//       3: { text: "Verified", color: "bg-green-100 text-green-800" }
//     };
    
//     const config = statusConfig[status] || { text: "Unknown", color: "bg-gray-100 text-gray-800" };
    
//     return (
//       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
//         {config.text}
//       </span>
//     );
//   };

//   const renderBankDetails = (customer: Customer) => {
//     const isVisible = visibleBankDetails.has(customer.user_id);
    
//     if (!customer.bank_info) {
//       return (
//         <div className="flex items-center gap-2 text-gray-500">
//           <CreditCard className="h-4 w-4" />
//           <span className="text-sm">No bank info</span>
//         </div>
//       );
//     }

//     return (
//       <div className="flex items-center gap-2">
//         <button
//           onClick={() => toggleBankDetails(customer.user_id)}
//           className="p-1 hover:bg-gray-100 rounded-md transition-colors"
//           title={isVisible ? "Hide bank details" : "Show bank details"}
//         >
//           {isVisible ? (
//             <EyeOff className="h-4 w-4 text-gray-600" />
//           ) : (
//             <Eye className="h-4 w-4 text-gray-600" />
//           )}
//         </button>
        
//         <div className="flex flex-col gap-1">
//           {isVisible ? (
//             <>
//               <div className="text-sm font-medium text-gray-900">
//                 A/C: {customer.bank_info.bank_account_number}
//               </div>
//               <div className="text-xs text-gray-600">
//                 IFSC: {customer.bank_info.ifsc_code}
//               </div>
//             </>
//           ) : (
//             <div className="flex items-center gap-2">
//               <CreditCard className="h-4 w-4 text-green-600" />
//               <span className="text-sm text-gray-600">Click to view</span>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   };

//   const renderMobileNumber = (phoneNumber?: string) => {
//     if (!phoneNumber) {
//       return (
//         <div className="flex items-center gap-2 text-gray-500">
//           <Phone className="h-4 w-4" />
//           <span className="text-sm">Not provided</span>
//         </div>
//       );
//     }

//     return (
//       <div className="flex items-center gap-2">
//         <Phone className="h-4 w-4 text-gray-600" />
//         <span className="text-sm text-gray-900">{phoneNumber}</span>
//       </div>
//     );
//   };

//   const getUserRoles = (customer: Customer) => {
//     const roles = [];
//     if (customer.tasker) roles.push("Tasker");
//     if (customer.task_manager) roles.push("Task Manager");
//     return roles.length > 0 ? roles.join(", ") : "Customer";
//   };

//   return (
//     <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold text-gray-900">Customers Management</h1>
//         <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
//           Total: {filteredCustomers.length} customers
//         </div>
//       </div>

//       {/* Search */}
//       <div className="flex items-center gap-2">
//         <div className="relative flex-1 max-w-md">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//           <input
//             type="search"
//             placeholder="Search by name, email or phone number..."
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             disabled={isLoading}
//           />
//         </div>
//       </div>

//       {/* Table */}
//       <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50 border-b border-gray-200">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Name
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Email
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Mobile
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Role
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Verification
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Bank Details
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
//                   Status
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {isLoading ? (
//                 <tr>
//                   <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
//                     <div className="flex items-center justify-center gap-2">
//                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
//                       Loading customers...
//                     </div>
//                   </td>
//                 </tr>
//               ) : error ? (
//                 <tr>
//                   <td colSpan={7} className="px-6 py-12 text-center">
//                     <div className="text-red-600">
//                       {error}
//                     </div>
//                     <button 
//                       onClick={fetchCustomers}
//                       className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                     >
//                       Retry
//                     </button>
//                   </td>
//                 </tr>
//               ) : filteredCustomers.length === 0 ? (
//                 <tr>
//                   <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
//                     {searchTerm ? "No customers found matching your search" : "No customers found"}
//                   </td>
//                 </tr>
//               ) : (
//                 filteredCustomers.map((customer, index) => (
//                   <tr key={customer.user_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm font-medium text-gray-900">
//                         {customer.user_fullname}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <div className="text-sm text-gray-600">
//                         {customer.user_email}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {renderMobileNumber(customer.phone_number)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
//                         {getUserRoles(customer)}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       {getVerificationStatus(customer.verification_status)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
//                       {renderBankDetails(customer)}
//                     </td>
//                     <td className="px-6 py-4 whitespace-nowrap">
//                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
//                         customer.status 
//                           ? "bg-red-100 text-red-800"
//                           : "bg-green-100 text-green-800" 
                          
//                       }`}>
//                         {customer.status ? "Inactive" : "Active"}
//                       </span>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }


"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Eye, EyeOff, CreditCard, Phone, Download, Calendar } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { toast } from "sonner";
import { ProfileReminderCell } from "@/components/admin/ProfileReminderCell";
import { Badge } from "@/components/ui/badge";

interface BankInfo {
  bank_account_number: string;
  ifsc_code: string;
}

interface Customer {
  user_id: string;
  user_fullname: string;
  user_email: string;
  phone_number?: string;
  tasker: boolean;
  task_manager: boolean;
  status: boolean;
  verification_status: number;
  bank_info: BankInfo | null;
  created_at?: string;
  joined_at?: string;
  date_joined?: string;
  tasks_completed?: number;
  earnings?: number;
  /** From all-user-details/ after profile reminder tracking (optional). */
  profile_reminder_send_count?: number;
  last_profile_reminder_at?: string;
  /** Signup bonus snapshot — same rules as wallet credit (optional until backend ships). */
  signup_bonus_claimed?: boolean;
  signup_bonus_eligible?: boolean;
  signup_bonus_missing?: string[];
  signup_bonus_amount?: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [visibleBankDetails, setVisibleBankDetails] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>("");

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("all-user-details/");
      const raw = response.data?.data ?? response.data;
      const list = Array.isArray(raw) ? raw : [];
      setCustomers(list);
    } catch {
      toast.error("An error occurred while fetching customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const filtered = customers.filter(
      (customer) =>
        customer.user_fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (customer.phone_number && customer.phone_number.includes(searchTerm))
    );
    const joinedAt = (c: Customer) =>
      (c as any).created_at ?? (c as any).joined_at ?? (c as any).date_joined ?? "";
    return [...filtered].sort((a, b) => {
      const ta = joinedAt(a) ? new Date(joinedAt(a)).getTime() : 0;
      const tb = joinedAt(b) ? new Date(joinedAt(b)).getTime() : 0;
      return tb - ta; // newest first
    });
  }, [customers, searchTerm]);

  const formatJoinedDate = (c: Customer) => {
    const iso = (c as any).created_at ?? (c as any).joined_at ?? (c as any).date_joined;
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  const newThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return customers.filter((c) => {
      const iso = (c as any).created_at ?? (c as any).joined_at ?? (c as any).date_joined;
      return iso && new Date(iso).getTime() >= weekAgo;
    }).length;
  }, [customers]);

  const toggleBankDetails = (userId: string) => {
    const newVisibleBankDetails = new Set(visibleBankDetails);
    if (newVisibleBankDetails.has(userId)) {
      newVisibleBankDetails.delete(userId);
    } else {
      newVisibleBankDetails.add(userId);
    }
    setVisibleBankDetails(newVisibleBankDetails);
  };

  const downloadExcel = async () => {
    try {
      const response = await axiosInstance.get('customers/download-excel/', {
        responseType: 'blob',
      });

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Get current date for filename
      const currentDate = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `customers_${currentDate}.xlsx`);
      
      // Append to html link element page
      document.body.appendChild(link);
      
      // Start download
      link.click();
      
      // Clean up and remove the link
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("Excel file downloaded successfully");
    } catch (error) {
      toast.error("Failed to download Excel file");
      console.error("Download error:", error);
    }
  };

  const getVerificationStatus = (status: number) => {
    // verification_status: 0=none, 1=PAN done, 2=Aadhar done, 3=Bank done (all verified)
    const pan = status >= 1;
    const aadhar = status >= 2;
    const bank = status >= 3;

    const Step = ({ label, done }: { label: string; done: boolean }) => (
      <span
        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${
          done ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
        }`}
        title={done ? `${label} verified` : `${label} pending`}
      >
        {done ? "✓" : "—"} {label}
      </span>
    );

    return (
      <div className="flex flex-wrap gap-1">
        <Step label="PAN" done={pan} />
        <Step label="Aadhar" done={aadhar} />
        <Step label="Bank" done={bank} />
      </div>
    );
  };

  const hasSignupBonusApi = (c: Customer) =>
    Object.prototype.hasOwnProperty.call(c, "signup_bonus_claimed") ||
    Object.prototype.hasOwnProperty.call(c, "signup_bonus_eligible") ||
    Object.prototype.hasOwnProperty.call(c, "signup_bonus_missing") ||
    Object.prototype.hasOwnProperty.call(c, "signup_bonus_amount");

  const renderSignupBonus = (customer: Customer) => {
    if (!hasSignupBonusApi(customer)) {
      return (
        <span className="text-sm text-gray-400" title="Not returned by API yet">
          —
        </span>
      );
    }

    const amount = Number(customer.signup_bonus_amount);
    const rupees = Number.isFinite(amount) && amount > 0 ? amount : 100;
    const label = `₹${rupees.toLocaleString("en-IN")}`;

    if (customer.signup_bonus_claimed === true) {
      return (
        <div className="flex flex-col gap-1">
          <Badge className="border border-emerald-200 bg-emerald-100 font-medium text-emerald-900 hover:bg-emerald-100">
            Credited
          </Badge>
          <span className="text-xs text-gray-500 tabular-nums">{label}</span>
        </div>
      );
    }

    if (customer.signup_bonus_eligible === true) {
      return (
        <Badge
          className="border border-sky-200 bg-sky-100 font-medium text-sky-950 hover:bg-sky-100"
          title={`Eligible for signup bonus (${label}); same rules as wallet credit`}
        >
          Ready · {label}
        </Badge>
      );
    }

    const missing = Array.isArray(customer.signup_bonus_missing) ? customer.signup_bonus_missing : [];
    if (missing.length > 0) {
      return (
        <div className="flex max-w-[240px] flex-col gap-1.5">
          <span className="text-[11px] font-medium text-amber-900">Missing for {label}</span>
          <div className="flex flex-wrap gap-1">
            {missing.map((item, i) => (
              <Badge
                key={`${item}-${i}`}
                variant="outline"
                className="border-amber-200 bg-amber-50 text-[10px] font-normal leading-tight text-amber-950"
              >
                {item}
              </Badge>
            ))}
          </div>
        </div>
      );
    }

    return (
      <span className="text-sm text-gray-400" title="No blockers listed; check API">
        —
      </span>
    );
  };

  const renderBankDetails = (customer: Customer) => {
    const isVisible = visibleBankDetails.has(customer.user_id);
    
    if (!customer.bank_info) {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <CreditCard className="h-4 w-4" />
          <span className="text-sm">No bank info</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleBankDetails(customer.user_id)}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
          title={isVisible ? "Hide bank details" : "Show bank details"}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4 text-gray-600" />
          ) : (
            <Eye className="h-4 w-4 text-gray-600" />
          )}
        </button>
        
        <div className="flex flex-col gap-1">
          {isVisible ? (
            <>
              <div className="text-sm font-medium text-gray-900">
                A/C: {customer.bank_info.bank_account_number}
              </div>
              <div className="text-xs text-gray-600">
                IFSC: {customer.bank_info.ifsc_code}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-600" />
              <span className="text-sm text-gray-600">Click to view</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMobileNumber = (phoneNumber?: string) => {
    if (!phoneNumber) {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <Phone className="h-4 w-4" />
          <span className="text-sm">Not provided</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <Phone className="h-4 w-4 text-gray-600" />
        <span className="text-sm text-gray-900">{phoneNumber}</span>
      </div>
    );
  };

  const getUserRoles = (customer: Customer) => {
    const roles = [];
    if (customer.tasker) roles.push("Tasker");
    if (customer.task_manager) roles.push("Task Manager");
    return roles.length > 0 ? roles.join(", ") : "Customer";
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers Management</h1>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
            Total: {filteredCustomers.length} customers
          </div>
          {newThisWeek > 0 && (
            <div className="text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg font-medium">
              +{newThisWeek} new this week
            </div>
          )}
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download Excel
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search by name, email or phone number..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mobile
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[140px]"
                  title="Matches wallet signup bonus rules (profile phone, KYC, UPI, address, etc.)"
                >
                  Signup bonus
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                  Profile reminders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bank Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      Loading customers...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="text-red-600">
                      {error}
                    </div>
                    <button 
                      onClick={fetchCustomers}
                      className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? "No customers found matching your search" : "No customers found"}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => (
                  <tr key={customer.user_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.user_fullname}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                        {formatJoinedDate(customer)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">
                        {customer.user_email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderMobileNumber(customer.phone_number)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {getUserRoles(customer)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getVerificationStatus(customer.verification_status)}
                    </td>
                    <td className="px-6 py-4 align-top whitespace-normal">
                      {renderSignupBonus(customer)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap align-top">
                      <ProfileReminderCell
                        row={customer as unknown as Record<string, unknown>}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap min-w-[200px]">
                      {renderBankDetails(customer)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}