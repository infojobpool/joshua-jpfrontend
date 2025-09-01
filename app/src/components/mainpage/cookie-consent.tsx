// "use client"

// import { useState } from "react"
// import Link from "next/link"
// import { Button } from "../../components/ui/button"

// export function CookieConsent() {
//   const [isVisible, setIsVisible] = useState(true)

//   if (!isVisible) return null

//   return (
//     <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
//       <div className="max-w-6xl mx-auto">
//         <h3 className="font-bold text-[#1a4e78] mb-2">Your Personal Information</h3>
//         <p className="text-sm mb-4">
//           Information about your browsing activity on our website, including clickstream and cookie data and
//           identifiers, is sent to our service providers and advertising networks. Please see our{" "}
//           <Link href="#" className="text-[#1a4e78] font-bold">
//             Privacy Policy
//           </Link>{" "}
//           for more information. You acknowledge and consent to these communications by browsing our website. In
//           addition, we use cookies and other analytics tools to deliver the best experience. These tools allow us to
//           measure website traffic, improve website performance, personalize advertising and web experiences, design
//           targeted marketing campaigns, and allow content sharing to social media.
//         </p>
//         <div className="flex gap-2">
//           <Button variant="outline" className="border-[#1a4e78] text-[#1a4e78]" onClick={() => setIsVisible(false)}>
//             Manage Cookies
//           </Button>
//           <Button className="bg-[#1a4e78] hover:bg-[#0f3a5f]" onClick={() => setIsVisible(false)}>
//             Accept All
//           </Button>
//         </div>
//       </div>
//     </div>
//   )
// }


"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "../../components/ui/button"

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if the user has already accepted or managed the cookie consent
    const hasConsented = localStorage.getItem("cookieConsent")
    if (!hasConsented) {
      setIsVisible(true)
    }
  }, [])

  const handleAccept = () => {
    // Set the flag in localStorage and hide the consent popup
    localStorage.setItem("cookieConsent", "true")
    setIsVisible(false)
  }

  const handleManageCookies = () => {
    // Optionally, you can handle "Manage Cookies" differently, e.g., redirect to a settings page
    // For now, we'll treat it the same as "Accept" to hide the popup
    localStorage.setItem("cookieConsent", "true")
    setIsVisible(false)
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50">
      <div className="max-w-6xl mx-auto">
        <h3 className="font-bold text-[#1a4e78] mb-2">Your Personal Information</h3>
        <p className="text-sm mb-4">
          Information about your browsing activity on our website, including clickstream and cookie data and
          identifiers, is sent to our service providers and advertising networks. Please see our{" "}
          <Link href="#" className="text-[#1a4e78] font-bold">
            Privacy Policy
          </Link>{" "}
          for more information. You acknowledge and consent to these communications by browsing our website. In
          addition, we use cookies and other analytics tools to deliver the best experience. These tools allow us to
          measure website traffic, improve website performance, personalize advertising and web experiences, design
          targeted marketing campaigns, and allow content sharing to social media.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="border-[#1a4e78] text-[#1a4e78]" onClick={handleManageCookies}>
            Manage Cookies
          </Button>
          <Button className="bg-[#1a4e78] hover:bg-[#0f3a5f]" onClick={handleAccept}>
            Accept All
          </Button>
        </div>
      </div>
    </div>
  )
}
