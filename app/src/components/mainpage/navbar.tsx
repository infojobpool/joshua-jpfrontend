// "use client"

// import { useState, useEffect } from "react"
// import Link from "next/link"
// import { motion } from "framer-motion"
// import { Button } from "../../components/ui/button"
// import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet"
// import { Menu } from "lucide-react"

// export function Navbar() {
//   const [scrolled, setScrolled] = useState(false)

//   useEffect(() => {
//     const handleScroll = () => {
//       setScrolled(window.scrollY > 10)
//     }

//     window.addEventListener("scroll", handleScroll)
//     return () => window.removeEventListener("scroll", handleScroll)
//   }, [])

//   return (
//     <motion.header
//       className={`sticky top-0 z-50 w-full transition-all duration-200 ${
//         scrolled ? "bg-white shadow-md" : "bg-transparent"
//       }`}
//       initial={{ y: -100 }}
//       animate={{ y: 0 }}
//       transition={{ type: "spring", stiffness: 100, damping: 15 }}
//     >
//       <div className="container flex h-16 items-center justify-between px-4 md:px-6">
//         <Link href="/" className="flex items-center gap-2">
//           <motion.div
//             className="text-blue-600 font-bold text-2xl"
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//           >
//             JobPool
//           </motion.div>
//         </Link>

//         <nav className="hidden md:flex items-center gap-6">
//           <Link href="/categories" className="text-sm font-medium hover:text-blue-600 transition-colors">
//             Categories
//           </Link>
//           <Link href="/browse-tasks" className="text-sm font-medium hover:text-blue-600 transition-colors">
//             Browse tasks
//           </Link>
//           <Link href="/how-it-works" className="text-sm font-medium hover:text-blue-600 transition-colors">
//             How it works
//           </Link>
//         </nav>

//         <div className="flex items-center gap-4">
//           <div className="hidden md:flex items-center gap-4">
//             <Link href="/signin">
//               <Button variant="ghost" size="sm">
//                 Log in
//               </Button>
//             </Link>
//             <Link href="/signup">
//               <Button variant="ghost" size="sm">
//                 Sign up
//               </Button>
//             </Link>
//           </div>

//           <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
//             <Link href="/signin">
//               <Button className="bg-blue-600 hover:bg-blue-700">Post a task</Button>
//             </Link>
//           </motion.div>

//           <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden md:block">
//             <Link href="/signup">
//               <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
//                 Become a Tasker
//               </Button>
//             </Link>
//           </motion.div>

//           <Sheet>
//             <SheetTrigger asChild>
//               <Button variant="ghost" size="icon" className="md:hidden">
//                 <Menu className="h-5 w-5" />
//                 <span className="sr-only">Toggle menu</span>
//               </Button>
//             </SheetTrigger>
//             <SheetContent side="right">
//               <nav className="flex flex-col gap-4 mt-8">
//                 <Link href="/categories" className="text-lg font-medium">
//                   Categories
//                 </Link>
//                 <Link href="/browse-tasks" className="text-lg font-medium">
//                   Browse tasks
//                 </Link>
//                 <Link href="/how-it-works" className="text-lg font-medium">
//                   How it works
//                 </Link>
//                 <Link href="/signin" className="text-lg font-medium">
//                   Log in
//                 </Link>
//                 <Link href="/signup" className="text-lg font-medium">
//                   Sign up
//                 </Link>
//                 <Link href="/become-tasker" className="text-lg font-medium">
//                   Become a Tasker
//                 </Link>
//               </nav>
//             </SheetContent>
//           </Sheet>
//         </div>
//       </div>
//     </motion.header>
//   )
// }


"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "../../components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet"
import { Menu } from "lucide-react"

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <motion.header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${
        scrolled ? "bg-white shadow-md" : "bg-transparent"
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
    >
      <div className="w-full max-w-none flex h-16 items-center justify-between px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            className="text-blue-600 font-bold text-2xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            JobPool
          </motion.div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <Link href="/categories" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Categories
          </Link>
          <Link href="/browse-tasks" className="text-sm font-medium hover:text-blue-600 transition-colors">
            Browse tasks
          </Link>
          <Link href="/how-it-works" className="text-sm font-medium hover:text-blue-600 transition-colors">
            How it works
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Link href="/signin">
              <Button variant="ghost" size="sm">
                Log in
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="ghost" size="sm">
                Sign up
              </Button>
            </Link>
          </div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link href="/signin">
              <Button className="bg-blue-600 hover:bg-blue-700">Post a task</Button>
            </Link>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="hidden md:block">
            <Link href="/signup">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                Become a Tasker
              </Button>
            </Link>
          </motion.div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                <Link href="/categories" className="text-lg font-medium">
                  Categories
                </Link>
                <Link href="/browse-tasks" className="text-lg font-medium">
                  Browse tasks
                </Link>
                <Link href="/how-it-works" className="text-lg font-medium">
                  How it works
                </Link>
                <Link href="/signin" className="text-lg font-medium">
                  Log in
                </Link>
                <Link href="/signup" className="text-lg font-medium">
                  Sign up
                </Link>
                <Link href="/become-tasker" className="text-lg font-medium">
                  Become a Tasker
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  )
}