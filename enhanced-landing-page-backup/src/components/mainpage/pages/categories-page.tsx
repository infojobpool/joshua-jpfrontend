// "use client"

// import { useState } from "react"
// import { motion } from "framer-motion"
// import Image from "next/image"
// import Link from "next/link"
// import { Input } from "../../../components/ui/input"
// import { Button } from "../../../components/ui/button"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
// import {
//   Truck,
//   Home,
//   Briefcase,
//   PaintBucket,
//   Wrench,
//   ShoppingBag,
//   Laptop,
//   Leaf,
//   Car,
//   Utensils,
//   Shirt,
//   Dog,
//   Camera,
//   Music,
//   Dumbbell,
//   Pencil,
//   Search,
// } from "lucide-react"

// export function CategoriesPage() {
//   const [searchQuery, setSearchQuery] = useState("")

//   const allCategories = [
//     {
//       icon: <Truck className="h-8 w-8" />,
//       name: "Moving & Delivery",
//       tasks: 1245,
//       description: "Get help with moving, furniture delivery, and courier services",
//       popular: ["Furniture delivery", "House moving", "Courier services", "IKEA pickup"],
//     },
//     {
//       icon: <Home className="h-8 w-8" />,
//       name: "Home Cleaning",
//       tasks: 987,
//       description: "Professional cleaning services for your home or office",
//       popular: ["Regular cleaning", "Deep cleaning", "End of lease", "Window cleaning"],
//     },
//     {
//       icon: <Briefcase className="h-8 w-8" />,
//       name: "Business Services",
//       tasks: 654,
//       description: "Professional services for your business needs",
//       popular: ["Data entry", "Virtual assistant", "Bookkeeping", "Market research"],
//     },
//     {
//       icon: <PaintBucket className="h-8 w-8" />,
//       name: "Home Improvement",
//       tasks: 876,
//       description: "Upgrade and renovate your living space",
//       popular: ["Painting", "Flooring", "Bathroom renovation", "Kitchen remodeling"],
//     },
//     {
//       icon: <Wrench className="h-8 w-8" />,
//       name: "Handyman",
//       tasks: 765,
//       description: "General repairs and maintenance for your home",
//       popular: ["Furniture assembly", "Repairs", "Mounting", "Installation"],
//     },
//     {
//       icon: <ShoppingBag className="h-8 w-8" />,
//       name: "Shopping",
//       tasks: 432,
//       description: "Get help with shopping and pickup services",
//       popular: ["Grocery shopping", "Gift shopping", "Personal shopping", "Pickup services"],
//     },
//     {
//       icon: <Laptop className="h-8 w-8" />,
//       name: "Tech Services",
//       tasks: 543,
//       description: "Technical support and IT services",
//       popular: ["Computer repair", "IT support", "Website development", "Tech setup"],
//     },
//     {
//       icon: <Leaf className="h-8 w-8" />,
//       name: "Gardening",
//       tasks: 321,
//       description: "Maintain and beautify your outdoor spaces",
//       popular: ["Lawn mowing", "Garden maintenance", "Landscaping", "Tree trimming"],
//     },
//     {
//       icon: <Car className="h-8 w-8" />,
//       name: "Automotive",
//       tasks: 289,
//       description: "Services for your vehicle needs",
//       popular: ["Car wash", "Vehicle detailing", "Tire change", "Battery replacement"],
//     },
//     {
//       icon: <Utensils className="h-8 w-8" />,
//       name: "Food & Catering",
//       tasks: 412,
//       description: "Food preparation and catering services",
//       popular: ["Meal prep", "Event catering", "Cooking lessons", "Personal chef"],
//     },
//     {
//       icon: <Shirt className="h-8 w-8" />,
//       name: "Clothing & Alterations",
//       tasks: 198,
//       description: "Clothing repairs and custom alterations",
//       popular: ["Tailoring", "Alterations", "Clothing repair", "Custom design"],
//     },
//     {
//       icon: <Dog className="h-8 w-8" />,
//       name: "Pet Care",
//       tasks: 356,
//       description: "Services for your furry friends",
//       popular: ["Dog walking", "Pet sitting", "Grooming", "Training"],
//     },
//     {
//       icon: <Camera className="h-8 w-8" />,
//       name: "Photography",
//       tasks: 245,
//       description: "Professional photography services",
//       popular: ["Event photography", "Portrait sessions", "Product photography", "Real estate"],
//     },
//     {
//       icon: <Music className="h-8 w-8" />,
//       name: "Music & Audio",
//       tasks: 178,
//       description: "Music and audio production services",
//       popular: ["Music lessons", "Audio editing", "Voice over", "DJ services"],
//     },
//     {
//       icon: <Dumbbell className="h-8 w-8" />,
//       name: "Fitness",
//       tasks: 267,
//       description: "Personal training and fitness services",
//       popular: ["Personal training", "Yoga instruction", "Fitness classes", "Nutrition advice"],
//     },
//     {
//       icon: <Pencil className="h-8 w-8" />,
//       name: "Education & Tutoring",
//       tasks: 312,
//       description: "Educational support and tutoring",
//       popular: ["Academic tutoring", "Language lessons", "Test preparation", "Music lessons"],
//     },
//   ]

//   const filteredCategories = allCategories.filter(
//     (category) =>
//       category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       category.description.toLowerCase().includes(searchQuery.toLowerCase()),
//   )

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1,
//         delayChildren: 0.3,
//       },
//     },
//   }

//   const itemVariants = {
//     hidden: { y: 20, opacity: 0 },
//     visible: {
//       y: 0,
//       opacity: 1,
//       transition: { type: "spring", stiffness: 100, damping: 10 },
//     },
//   }

//   return (
//     <>
//       <section className="bg-slate-50 py-12 md:py-20">
//         <div className="container px-4 md:px-6">
//           <motion.div
//             className="max-w-3xl mx-auto text-center"
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//           >
//             <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">Categories</h1>
//             <p className="mt-4 text-xl text-gray-500">Browse all task categories and find the help you need</p>
//             <div className="mt-8 flex items-center max-w-md mx-auto">
//               <Input
//                 type="text"
//                 placeholder="Search categories..."
//                 className="flex-1"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//               <Button className="ml-2 bg-blue-600 hover:bg-blue-700">
//                 <Search className="h-4 w-4" />
//               </Button>
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       <section className="py-16">
//         <div className="container px-4 md:px-6">
//           <Tabs defaultValue="all" className="w-full">
//             <TabsList className="mb-8 flex flex-wrap justify-center gap-2">
//               <TabsTrigger value="all">All Categories</TabsTrigger>
//               <TabsTrigger value="popular">Most Popular</TabsTrigger>
//               <TabsTrigger value="home">Home & Property</TabsTrigger>
//               <TabsTrigger value="business">Business</TabsTrigger>
//               <TabsTrigger value="personal">Personal</TabsTrigger>
//             </TabsList>

//             <TabsContent value="all" className="mt-0">
//               <motion.div
//                 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//               >
//                 {filteredCategories.map((category, index) => (
//                   <motion.div
//                     key={index}
//                     variants={itemVariants}
//                     whileHover={{
//                       scale: 1.03,
//                       boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                     }}
//                     className="bg-white rounded-xl p-6 shadow-md transition-all duration-200"
//                   >
//                     <Link href={`/categories/${category.name.toLowerCase().replace(/\s+/g, "-")}`}>
//                       <div className="flex flex-col h-full">
//                         <div className="p-3 bg-blue-50 rounded-full mb-4 w-fit">{category.icon}</div>
//                         <h3 className="font-bold text-xl mb-2">{category.name}</h3>
//                         <p className="text-gray-500 mb-4 flex-grow">{category.description}</p>
//                         <div className="mt-auto">
//                           <div className="text-sm text-blue-600 font-medium mb-2">Popular tasks:</div>
//                           <ul className="text-sm text-gray-500">
//                             {category.popular.slice(0, 2).map((task, i) => (
//                               <li key={i} className="mb-1">
//                                 • {task}
//                               </li>
//                             ))}
//                           </ul>
//                           <div className="mt-4 text-sm font-medium text-gray-500">{category.tasks} active tasks</div>
//                         </div>
//                       </div>
//                     </Link>
//                   </motion.div>
//                 ))}
//               </motion.div>
//             </TabsContent>

//             <TabsContent value="popular">
//               <motion.div
//                 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//               >
//                 {filteredCategories
//                   .sort((a, b) => b.tasks - a.tasks)
//                   .slice(0, 8)
//                   .map((category, index) => (
//                     <motion.div
//                       key={index}
//                       variants={itemVariants}
//                       whileHover={{
//                         scale: 1.03,
//                         boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                       }}
//                       className="bg-white rounded-xl p-6 shadow-md transition-all duration-200"
//                     >
//                       <Link href={`/categories/${category.name.toLowerCase().replace(/\s+/g, "-")}`}>
//                         <div className="flex flex-col h-full">
//                           <div className="p-3 bg-blue-50 rounded-full mb-4 w-fit">{category.icon}</div>
//                           <h3 className="font-bold text-xl mb-2">{category.name}</h3>
//                           <p className="text-gray-500 mb-4 flex-grow">{category.description}</p>
//                           <div className="mt-auto">
//                             <div className="text-sm text-blue-600 font-medium mb-2">Popular tasks:</div>
//                             <ul className="text-sm text-gray-500">
//                               {category.popular.slice(0, 2).map((task, i) => (
//                                 <li key={i} className="mb-1">
//                                   • {task}
//                                 </li>
//                               ))}
//                             </ul>
//                             <div className="mt-4 text-sm font-medium text-gray-500">{category.tasks} active tasks</div>
//                           </div>
//                         </div>
//                       </Link>
//                     </motion.div>
//                   ))}
//               </motion.div>
//             </TabsContent>

//             {/* Other tab contents would follow the same pattern */}
//             <TabsContent value="home">
//               <motion.div
//                 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//               >
//                 {filteredCategories
//                   .filter((cat) => ["Home Cleaning", "Home Improvement", "Handyman", "Gardening"].includes(cat.name))
//                   .map((category, index) => (
//                     <motion.div
//                       key={index}
//                       variants={itemVariants}
//                       whileHover={{
//                         scale: 1.03,
//                         boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                       }}
//                       className="bg-white rounded-xl p-6 shadow-md transition-all duration-200"
//                     >
//                       <Link href={`/categories/${category.name.toLowerCase().replace(/\s+/g, "-")}`}>
//                         <div className="flex flex-col h-full">
//                           <div className="p-3 bg-blue-50 rounded-full mb-4 w-fit">{category.icon}</div>
//                           <h3 className="font-bold text-xl mb-2">{category.name}</h3>
//                           <p className="text-gray-500 mb-4 flex-grow">{category.description}</p>
//                           <div className="mt-auto">
//                             <div className="text-sm text-blue-600 font-medium mb-2">Popular tasks:</div>
//                             <ul className="text-sm text-gray-500">
//                               {category.popular.slice(0, 2).map((task, i) => (
//                                 <li key={i} className="mb-1">
//                                   • {task}
//                                 </li>
//                               ))}
//                             </ul>
//                             <div className="mt-4 text-sm font-medium text-gray-500">{category.tasks} active tasks</div>
//                           </div>
//                         </div>
//                       </Link>
//                     </motion.div>
//                   ))}
//               </motion.div>
//             </TabsContent>

//             {/* Business tab */}
//             <TabsContent value="business">
//               <motion.div
//                 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//               >
//                 {filteredCategories
//                   .filter((cat) =>
//                     ["Business Services", "Tech Services", "Photography", "Music & Audio"].includes(cat.name),
//                   )
//                   .map((category, index) => (
//                     <motion.div
//                       key={index}
//                       variants={itemVariants}
//                       whileHover={{
//                         scale: 1.03,
//                         boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                       }}
//                       className="bg-white rounded-xl p-6 shadow-md transition-all duration-200"
//                     >
//                       <Link href={`/categories/${category.name.toLowerCase().replace(/\s+/g, "-")}`}>
//                         <div className="flex flex-col h-full">
//                           <div className="p-3 bg-blue-50 rounded-full mb-4 w-fit">{category.icon}</div>
//                           <h3 className="font-bold text-xl mb-2">{category.name}</h3>
//                           <p className="text-gray-500 mb-4 flex-grow">{category.description}</p>
//                           <div className="mt-auto">
//                             <div className="text-sm text-blue-600 font-medium mb-2">Popular tasks:</div>
//                             <ul className="text-sm text-gray-500">
//                               {category.popular.slice(0, 2).map((task, i) => (
//                                 <li key={i} className="mb-1">
//                                   • {task}
//                                 </li>
//                               ))}
//                             </ul>
//                             <div className="mt-4 text-sm font-medium text-gray-500">{category.tasks} active tasks</div>
//                           </div>
//                         </div>
//                       </Link>
//                     </motion.div>
//                   ))}
//               </motion.div>
//             </TabsContent>

//             {/* Personal tab */}
//             <TabsContent value="personal">
//               <motion.div
//                 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//               >
//                 {filteredCategories
//                   .filter((cat) => ["Pet Care", "Fitness", "Education & Tutoring", "Shopping"].includes(cat.name))
//                   .map((category, index) => (
//                     <motion.div
//                       key={index}
//                       variants={itemVariants}
//                       whileHover={{
//                         scale: 1.03,
//                         boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                       }}
//                       className="bg-white rounded-xl p-6 shadow-md transition-all duration-200"
//                     >
//                       <Link href={`/categories/${category.name.toLowerCase().replace(/\s+/g, "-")}`}>
//                         <div className="flex flex-col h-full">
//                           <div className="p-3 bg-blue-50 rounded-full mb-4 w-fit">{category.icon}</div>
//                           <h3 className="font-bold text-xl mb-2">{category.name}</h3>
//                           <p className="text-gray-500 mb-4 flex-grow">{category.description}</p>
//                           <div className="mt-auto">
//                             <div className="text-sm text-blue-600 font-medium mb-2">Popular tasks:</div>
//                             <ul className="text-sm text-gray-500">
//                               {category.popular.slice(0, 2).map((task, i) => (
//                                 <li key={i} className="mb-1">
//                                   • {task}
//                                 </li>
//                               ))}
//                             </ul>
//                             <div className="mt-4 text-sm font-medium text-gray-500">{category.tasks} active tasks</div>
//                           </div>
//                         </div>
//                       </Link>
//                     </motion.div>
//                   ))}
//               </motion.div>
//             </TabsContent>
//           </Tabs>
//         </div>
//       </section>

//       <section className="py-16 bg-slate-50">
//         <div className="container px-4 md:px-6">
//           <div className="grid md:grid-cols-2 gap-12 items-center">
//             <motion.div
//               initial={{ opacity: 0, x: -50 }}
//               whileInView={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.5 }}
//               viewport={{ once: true }}
//             >
//               <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Ready to get started?</h2>
//               <p className="text-xl text-gray-500 mb-8">
//                 Post a task now and find the perfect person for the job, or become a Tasker and start earning.
//               </p>
//               <div className="flex flex-col sm:flex-row gap-4">
//                 <Link href="/post-task">
//                   <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg w-full sm:w-auto">
//                     Post a Task
//                   </Button>
//                 </Link>
//                 <Link href="/become-tasker">
//                   <Button
//                     variant="outline"
//                     className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg w-full sm:w-auto"
//                   >
//                     Become a Tasker
//                   </Button>
//                 </Link>
//               </div>
//             </motion.div>
//             <motion.div
//               initial={{ opacity: 0, x: 50 }}
//               whileInView={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.5 }}
//               viewport={{ once: true }}
//               className="relative h-[400px]"
//             >
//               <Image
//                 src="images/images/placeholder.svg?height=400&width=600"
//                 fill
//                 alt="TaskMaster categories"
//                 className="object-cover rounded-xl"
//               />
//             </motion.div>
//           </div>
//         </div>
//       </section>
//     </>
//   )
// }



// "use client";

// import { useEffect, useState } from "react";
// import { motion } from "framer-motion";
// import Image from "next/image";
// import Link from "next/link";
// import { Input } from "../../../components/ui/input";
// import { Button } from "../../../components/ui/button";
// import {
//   Tabs,
//   TabsContent,
//   TabsList,
//   TabsTrigger,
// } from "../../../components/ui/tabs";
// import {
//   Truck,
//   Home,
//   Briefcase,
//   PaintBucket,
//   Wrench,
//   ShoppingBag,
//   Laptop,
//   Leaf,
//   Car,
//   Utensils,
//   Shirt,
//   Dog,
//   Camera,
//   Music,
//   Dumbbell,
//   Pencil,
//   Search,
//   SquareCheckBig,
// } from "lucide-react";
// import axiosInstance from "@/lib/axiosInstance";
// import { toast } from "sonner";

// interface Category {
//   category_id: string;
//   category_name: string;
//   status: boolean;
//   created_at: string;
//   icon?: React.ReactNode;
//   tasks?: number;
// }

// export function CategoriesPage() {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [categories, setCategories] = useState<Category[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   // Map category names to icons
//   const categoryIcons: { [key: string]: React.ReactNode } = {
//     "Moving & Delivery": <Truck className="h-8 w-8" />,
//     "Home Cleaning": <Home className="h-8 w-8" />,
//     "Business Services": <Briefcase className="h-8 w-8" />,
//     "Home Improvement": <PaintBucket className="h-8 w-8" />,
//     Handyman: <Wrench className="h-8 w-8" />,
//     Shopping: <ShoppingBag className="h-8 w-8" />,
//     "Tech Services": <Laptop className="h-8 w-8" />,
//     Gardening: <Leaf className="h-8 w-8" />,
//     Automotive: <Car className="h-8 w-8" />,
//     "Food & Catering": <Utensils className="h-8 w-8" />,
//     "Clothing & Alterations": <Shirt className="h-8 w-8" />,
//     "Pet Care": <Dog className="h-8 w-8" />,
//     Photography: <Camera className="h-8 w-8" />,
//     "Music & Audio": <Music className="h-8 w-8" />,
//     Fitness: <Dumbbell className="h-8 w-8" />,
//     "Education & Tutoring": <Pencil className="h-8 w-8" />,
//   };

//   const fetchCategories = async () => {
//     try {
//       setIsLoading(true);
//       const response = await axiosInstance.get("get-all-categories/");
//       if (response.data.status_code === 200) {
//         // Map icons to fetched categories
//         const enrichedCategories = response.data.data.map((category: Category) => ({
//           ...category,
//           icon: categoryIcons[category.category_name] || <SquareCheckBig  className="h-8 w-8" />, // Fallback icon
//           tasks: category.tasks || 0, // Fallback to 0 if tasks is undefined
//         }));
//         setCategories(enrichedCategories);
//       } else {
//         toast.error(response.data.message || "Failed to fetch categories");
//       }
//     } catch (error) {
//       toast.error(
//         error instanceof Error
//           ? error.message
//           : "An error occurred while fetching categories"
//       );
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCategories();
//   }, []);

//   const filteredCategories = categories.filter((category) =>
//     category.category_name.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const containerVariants = {
//     hidden: { opacity: 0 },
//     visible: {
//       opacity: 1,
//       transition: {
//         staggerChildren: 0.1,
//         delayChildren: 0.3,
//       },
//     },
//   };

//   const itemVariants = {
//     hidden: { y: 20, opacity: 0 },
//     visible: {
//       y: 0,
//       opacity: 1,
//       transition: { type: "spring", stiffness: 100, damping: 10 },
//     },
//   };

//   return (
//     <>
//       <section className="bg-slate-50 py-12 md:py-20">
//         <div className="container px-4 md:px-6">
//           <motion.div
//             className="max-w-3xl mx-auto text-center"
//             initial={{ opacity: 0, y: -20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ duration: 0.5 }}
//           >
//             <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
//               Categories
//             </h1>
//             <p className="mt-4 text-xl text-gray-500">
//               Browse all task categories and find the help you need
//             </p>
//             <div className="mt-8 flex items-center max-w-md mx-auto">
//               <Input
//                 type="text"
//                 placeholder="Search categories..."
//                 className="flex-1"
//                 value={searchQuery}
//                 onChange={(e) => setSearchQuery(e.target.value)}
//               />
//               <Button className="ml-2 bg-blue-600 hover:bg-blue-700">
//                 <Search className="h-4 w-4" />
//               </Button>
//             </div>
//           </motion.div>
//         </div>
//       </section>

//       <section className="py-16">
//         <div className="container px-4 md:px-6">
//           <Tabs defaultValue="all" className="w-full">
//             <TabsList className="mb-8 flex flex-wrap justify-center gap-2">
//               <TabsTrigger value="all">All Categories</TabsTrigger>
//               <TabsTrigger value="popular">Most Popular</TabsTrigger>
//               <TabsTrigger value="home">Home & Property</TabsTrigger>
//               <TabsTrigger value="business">Business</TabsTrigger>
//               <TabsTrigger value="personal">Personal</TabsTrigger>
//             </TabsList>

//             <TabsContent value="all" className="mt-0">
//               <motion.div
//                 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//               >
//                 {filteredCategories.map((category, index) => (
//                   <motion.div
//                     key={index}
//                     variants={itemVariants}
//                     whileHover={{
//                       scale: 1.03,
//                       boxShadow:
//                         "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                     }}
//                     className="bg-white rounded-xl p-6 shadow-md transition-all duration-200"
//                   >
//                     <Link
//                       href={`/categories/${category.category_name
//                         .toLowerCase()
//                         .replace(/\s+/g, "-")}`}
//                     >
//                       <div className="flex flex-col h-full">
//                         <div className="p-3 bg-blue-50 rounded-full mb-4 w-fit">
//                           {category.icon}
//                         </div>
//                         <h3 className="font-bold text-xl mb-2">
//                           {category.category_name}
//                         </h3>
//                         <div className="mt-auto">
//                           <div className="mt-4 text-sm font-medium text-gray-500">
//                             {category.tasks || 0} active tasks
//                           </div>
//                         </div>
//                       </div>
//                     </Link>
//                   </motion.div>
//                 ))}
//               </motion.div>
//             </TabsContent>

//             <TabsContent value="popular">
//               <motion.div
//                 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//               >
//                 {filteredCategories
//                   .sort((a, b) => (b.tasks || 0) - (a.tasks || 0))
//                   .slice(0, 8)
//                   .map((category, index) => (
//                     <motion.div
//                       key={index}
//                       variants={itemVariants}
//                       whileHover={{
//                         scale: 1.03,
//                         boxShadow:
//                           "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                       }}
//                       className="bg-white rounded-xl p-6 shadow-md transition-all duration-200"
//                     >
//                       <Link
//                         href={`/categories/${category.category_name
//                           .toLowerCase()
//                           .replace(/\s+/g, "-")}`}
//                       >
//                         <div className="flex flex-col h-full">
//                           <div className="p-3 bg-blue-50 rounded-full mb-4 w-fit">
//                             {category.icon}
//                           </div>
//                           <h3 className="font-bold text-xl mb-2">
//                             {category.category_name}
//                           </h3>
//                           <div className="mt-auto">
//                             <div className="mt-4 text-sm font-medium text-gray-500">
//                               {category.tasks || 0} active tasks
//                             </div>
//                           </div>
//                         </div>
//                       </Link>
//                     </motion.div>
//                   ))}
//               </motion.div>
//             </TabsContent>

//             <TabsContent value="home">
//               <motion.div
//                 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//               >
//                 {filteredCategories
//                   .filter((cat) =>
//                     [
//                       "Home Cleaning",
//                       "Home Improvement",
//                       "Handyman",
//                       "Gardening",
//                     ].includes(cat.category_name)
//                   )
//                   .map((category, index) => (
//                     <motion.div
//                       key={index}
//                       variants={itemVariants}
//                       whileHover={{
//                         scale: 1.03,
//                         boxShadow:
//                           "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                       }}
//                       className="bg-white rounded-xl p-6 shadow-md transition-all duration-200"
//                     >
//                       <Link
//                         href={`/categories/${category.category_name
//                           .toLowerCase()
//                           .replace(/\s+/g, "-")}`}
//                       >
//                         <div className="flex flex-col h-full">
//                           <div className="p-3 bg-blue-50 rounded-full mb-4 w-fit">
//                             {category.icon}
//                           </div>
//                           <h3 className="font-bold text-xl mb-2">
//                             {category.category_name}
//                           </h3>
//                           <div className="mt-auto">
//                             <div className="mt-4 text-sm font-medium text-gray-500">
//                               {category.tasks || 0} active tasks
//                             </div>
//                           </div>
//                         </div>
//                       </Link>
//                     </motion.div>
//                   ))}
//               </motion.div>
//             </TabsContent>

//             <TabsContent value="business">
//               <motion.div
//                 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//               >
//                 {filteredCategories
//                   .filter((cat) =>
//                     [
//                       "Business Services",
//                       "Tech Services",
//                       "Photography",
//                       "Music & Audio",
//                     ].includes(cat.category_name)
//                   )
//                   .map((category, index) => (
//                     <motion.div
//                       key={index}
//                       variants={itemVariants}
//                       whileHover={{
//                         scale: 1.03,
//                         boxShadow:
//                           "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                       }}
//                       className="bg-white rounded-xl p-6 shadow-md transition-all duration-200"
//                     >
//                       <Link
//                         href={`/categories/${category.category_name
//                           .toLowerCase()
//                           .replace(/\s+/g, "-")}`}
//                       >
//                         <div className="flex flex-col h-full">
//                           <div className="p-3 bg-blue-50 rounded-full mb-4 w-fit">
//                             {category.icon}
//                           </div>
//                           <h3 className="font-bold text-xl mb-2">
//                             {category.category_name}
//                           </h3>
//                           <div className="mt-auto">
//                             <div className="mt-4 text-sm font-medium text-gray-500">
//                               {category.tasks || 0} active tasks
//                             </div>
//                           </div>
//                         </div>
//                       </Link>
//                     </motion.div>
//                   ))}
//               </motion.div>
//             </TabsContent>

//             <TabsContent value="personal">
//               <motion.div
//                 className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
//                 variants={containerVariants}
//                 initial="hidden"
//                 animate="visible"
//               >
//                 {filteredCategories
//                   .filter((cat) =>
//                     [
//                       "Pet Care",
//                       "Fitness",
//                       "Education & Tutoring",
//                       "Shopping",
//                     ].includes(cat.category_name)
//                   )
//                   .map((category, index) => (
//                     <motion.div
//                       key={index}
//                       variants={itemVariants}
//                       whileHover={{
//                         scale: 1.03,
//                         boxShadow:
//                           "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
//                       }}
//                       className="bg-white rounded-xl p-6 shadow-md transition-all duration-200"
//                     >
//                       <Link
//                         href={`/categories/${category.category_name
//                           .toLowerCase()
//                           .replace(/\s+/g, "-")}`}
//                       >
//                         <div className="flex flex-col h-full">
//                           <div className="p-3 bg-blue-50 rounded-full mb-4 w-fit">
//                             {category.icon}
//                           </div>
//                           <h3 className="font-bold text-xl mb-2">
//                             {category.category_name}
//                           </h3>
//                           <div className="mt-auto">
//                             <div className="mt-4 text-sm font-medium text-gray-500">
//                               {category.tasks || 0} active tasks
//                             </div>
//                           </div>
//                         </div>
//                       </Link>
//                     </motion.div>
//                   ))}
//               </motion.div>
//             </TabsContent>
//           </Tabs>
//         </div>
//       </section>

//       <section className="py-16 bg-slate-50">
//         <div className="container px-4 md:px-6">
//           <div className="grid md:grid-cols-2 gap-12 items-center">
//             <motion.div
//               initial={{ opacity: 0, x: -50 }}
//               whileInView={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.5 }}
//               viewport={{ once: true }}
//             >
//               <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
//                 Ready to get started?
//               </h2>
//               <p className="text-xl text-gray-500 mb-8">
//                 Post a task now and find the perfect person for the job, or
//                 become a Tasker and start earning.
//               </p>
//               <div className="flex flex-col sm:flex-row gap-4">
//                 <Link href="/post-task">
//                   <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg w-full sm:w-auto">
//                     Post a Task
//                   </Button>
//                 </Link>
//                 <Link href="/become-tasker">
//                   <Button
//                     variant="outline"
//                     className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg w-full sm:w-auto"
//                   >
//                     Become a Tasker
//                   </Button>
//                 </Link>
//               </div>
//             </motion.div>
//             <motion.div
//               initial={{ opacity: 0, x: 50 }}
//               whileInView={{ opacity: 1, x: 0 }}
//               transition={{ duration: 0.5 }}
//               viewport={{ once: true }}
//               className="relative h-[400px]"
//             >
//               <Image
//                 src="images/placeholder.svg?height=400&width=600"
//                 fill
//                 alt="TaskMaster categories"
//                 className="object-cover rounded-xl"
//               />
//             </motion.div>
//           </div>
//         </div>
//       </section>
//     </>
//   );
// }

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { SquareCheckBig, Search } from "lucide-react";
import axiosInstance from "@/lib/axiosInstance";
import { toast } from "sonner";

interface Category {
  category_id: string;
  category_name: string;
  status: boolean;
  created_at: string;
  icon?: React.ReactNode;
  tasks?: number;
}

export function CategoriesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("get-all-categories/");
      if (response.data.status_code === 200) {
        const enrichedCategories = response.data.data.map((category: Category) => ({
          ...category,
          icon: <SquareCheckBig className="h-8 w-8" />,
          tasks: category.job_count || 0,
        }));
        setCategories(enrichedCategories);
      } else {
        toast.error(response.data.message || "Failed to fetch categories");
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while fetching categories"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const filteredCategories = categories.filter((category) =>
    category.category_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 10 },
    },
  };

  return (
    <>
      <section className="bg-slate-50 py-12 md:py-20">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Categories
            </h1>
            <p className="mt-4 text-xl text-gray-500">
              Browse all task categories and find the help you need
            </p>
            <div className="mt-8 flex items-center max-w-md mx-auto">
              <Input
                type="text"
                placeholder="Search categories..."
                className="flex-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button className="ml-2 bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredCategories.map((category, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{
                  scale: 1.03,
                  boxShadow:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                }}
                className="bg-white rounded-xl p-6 shadow-md transition-all duration-200"
              >
                <Link
                  href={`/categories/${category.category_name
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  <div className="flex flex-col h-full">
                    <div className="p-3 bg-blue-50 rounded-full mb-4 w-fit">
                      {category.icon}
                    </div>
                    <h3 className="font-bold text-xl mb-2">
                      {category.category_name}
                    </h3>
                    <div className="mt-auto">
                      <div className="mt-4 text-sm font-medium text-gray-500">
                        {category.tasks || 0} active tasks
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
                Ready to get started?
              </h2>
              <p className="text-xl text-gray-500 mb-8">
                Post a task now and find the perfect person for the job, or
                become a Tasker and start earning.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/post-task">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg w-full sm:w-auto">
                    Post a Task
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg w-full sm:w-auto"
                  >
                    Become a Tasker
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="relative h-[400px]"
            >
              <Image
                src="images/placeholder.svg?height=400&width=600"
                fill
                alt="TaskMaster categories"
                className="object-cover rounded-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}