// "use client"

// import type React from "react"

// import { useState } from "react"
// import { usePathname, useRouter } from "next/navigation"
// import { Header } from "../../components/header"
// import { Sidebar } from "../../components/sidebar"

// export default function AdminLayout({ children }: { children: React.ReactNode }) {
//   const pathname = usePathname()
//   const router = useRouter()
//   const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

//   const handleLogout = () => {
//     // In a real application, you would implement proper logout logic here
//     // For demo purposes, we'll just redirect to the login page
//     router.push("/")
//   }

//   // If the current path is the login page, render without the admin layout
//   if (pathname === "/") {
//     return children
//   }

//   return (
  
//     <div className="flex min-h-screen flex-col">
//       <Header
//         isMobileNavOpen={isMobileNavOpen}
//         setIsMobileNavOpen={setIsMobileNavOpen}
//         pathname={pathname}
//         handleLogout={handleLogout}
//       />
//       <div className="flex flex-1">
//         <Sidebar pathname={pathname} handleLogout={handleLogout} />
//         <main className="flex-1 p-4 md:p-6">{children}</main>
//       </div>
//     </div>
//   )
// }


"use client"

import type React from "react"
import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { Header } from "../../components/header"
import { Sidebar } from "../../components/sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  const handleLogout = () => {
    // In a real application, you would implement proper logout logic here
    // For demo purposes, we'll just redirect to the login page
    router.push("/")
  }

  // If the current path is the login page, render without the admin layout
  if (pathname === "/") {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        isMobileNavOpen={isMobileNavOpen}
        setIsMobileNavOpen={setIsMobileNavOpen}
        pathname={pathname}
        handleLogout={handleLogout}
      />
      <div className="flex flex-1">
        <Sidebar pathname={pathname} />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}