// import { Button } from "./ui/button";
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card";

// interface Task {
//     id: string;
//     title: string;
//     description: string;
//     budget: number;
//     location: string;
//     status: boolean;
//     postedAt: string;
//     dueDate: string;
//     category: string;
//     images: Image[];
//     poster: User;
//     offers: Offer[];
//     assignedTasker?: User;
//   }
//   interface Image {
//     id: string;
//     url: string;
//     alt: string;
//   }
//   interface Offer {
//     id: string;
//     tasker: User;
//     amount: number;
//     message: string;
//     createdAt: string;
//   }
  
//   interface User {
//     id: string;
//     name: string;
//     rating: number;
//     taskCount: number;
//     joinedDate: string;
//   }
  

// interface PaymentModalProps {
//     show: boolean;
//     task: Task;
//     handlePayment: () => void;
//     closeModal: () => void;
//     isSubmitting: boolean;
//   }
  
//   export  function PaymentModal({ show, task, handlePayment, closeModal, isSubmitting }: PaymentModalProps) {
//     if (!show) return null;
  
//     return (
//       <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//         <Card className="w-full max-w-md">
//           <CardHeader>
//             <CardTitle>Complete Payment</CardTitle>
//             <CardDescription>Pay the tasker for completing the task</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="border rounded-lg p-4 space-y-2">
//               <div className="flex justify-between">
//                 <span className="text-muted-foreground">Task Amount</span>
//                 <span className="font-medium">${task.budget.toFixed(2)}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span className="text-muted-foreground">Service Fee (10%)</span>
//                 <span className="font-medium">${(task.budget * 0.1).toFixed(2)}</span>
//               </div>
//               <div className="border-t pt-2 mt-2 flex justify-between">
//                 <span className="font-medium">Total</span>
//                 <span className="font-bold">${(task.budget * 1.1).toFixed(2)}</span>
//               </div>
//             </div>
//             <div className="space-y-2">
//               <label className="text-sm font-medium">Payment Method</label>
//               <div className="flex items-center space-x-2 border rounded-md p-3">
//                 <input
//                   type="radio"
//                   id="card1"
//                   name="paymentMethod"
//                   className="h-4 w-4"
//                   defaultChecked
//                 />
//                 <label htmlFor="card1" className="flex-1">
//                   <div className="flex items-center justify-between">
//                     <span>Credit Card ending in 4242</span>
//                     <span className="text-xs bg-muted px-2 py-1 rounded">Default</span>
//                   </div>
//                 </label>
//               </div>
//               <div className="flex items-center space-x-2 border rounded-md p-3">
//                 <input
//                   type="radio"
//                   id="card2"
//                   name="paymentMethod"
//                   className="h-4 w-4"
//                 />
//                 <label htmlFor="card2" className="flex-1">
//                   <span>Add New Payment Method</span>
//                 </label>
//               </div>
//             </div>
//           </CardContent>
//           <CardFooter className="flex justify-between">
//             <Button variant="outline" onClick={closeModal}>
//               Cancel
//             </Button>
//             <Button onClick={handlePayment} disabled={isSubmitting}>
//               {isSubmitting ? "Processing..." : "Pay Now"}
//             </Button>
//           </CardFooter>
//         </Card>
//       </div>
//     );
//   }


"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface Task {
  id: string
  title: string
  description: string
  budget: number
  location: string
  status: boolean
  postedAt: string
  dueDate: string
  category: string
  images: Image[]
  poster: User
  offers: Offer[]
  assignedTasker?: User
}

interface Image {
  id: string
  url: string
  alt: string
}

interface Offer {
  id: string
  tasker: User
  amount: number
  message: string
  createdAt: string
}

interface User {
  id: string
  name: string
  rating: number
  taskCount: number
  joinedDate: string
}

interface PaymentModalProps {
  show: boolean
  task: Task
  handlePayment: () => void
  closeModal: () => void
  isSubmitting: boolean
  bidAmount: number
}

export function PaymentModal({ show, task, handlePayment, closeModal, isSubmitting, bidAmount }: PaymentModalProps) {
  if (!show) return null


  const commission = bidAmount * 0.05 // 5% commission
  const gst = (bidAmount + commission) * 0.18 // 18% GST on bid amount + commission
  const totalAmount = bidAmount + commission + gst

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>Review and complete your payment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bid Amount</span>
              <span className="font-medium">₹{bidAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Commission (5%)</span>
              <span className="font-medium">₹{commission.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GST (18%)</span>
              <span className="font-medium">₹{gst.toFixed(2)}</span>
            </div>
            <div className="border-t pt-3 mt-3 flex justify-between">
              <span className="font-semibold text-lg">Total Amount</span>
              <span className="font-bold text-lg text-green-600">₹{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* <div className="space-y-2">
            <label className="text-sm font-medium">Payment Method</label>
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <input type="radio" id="card1" name="paymentMethod" className="h-4 w-4" defaultChecked />
              <label htmlFor="card1" className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Credit Card ending in 4242</span>
                  <span className="text-xs bg-muted px-2 py-1 rounded">Default</span>
                </div>
              </label>
            </div>
            <div className="flex items-center space-x-2 border rounded-md p-3">
              <input type="radio" id="card2" name="paymentMethod" className="h-4 w-4" />
              <label htmlFor="card2" className="flex-1">
                <span>Add New Payment Method</span>
              </label>
            </div>
          </div> */}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={closeModal} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            {isSubmitting ? "Processing..." : "Proceed to Pay"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
