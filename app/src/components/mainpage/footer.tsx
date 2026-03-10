// "use client"

// import { motion } from "framer-motion"
// import Link from "next/link"
// import { Button } from "../../components/ui/button"
// import { Input } from "../../components/ui/input"
// import { Facebook, Twitter, Instagram, Linkedin, ArrowRight } from "lucide-react"

// export function Footer() {
//   const footerLinks = [
//     {
//       title: "Company",
//       links: [
//         { name: "About us", href: "#" },
//         { name: "Careers", href: "#" },
//         { name: "Press", href: "#" },
//         { name: "Blog", href: "#" },
//       ],
//     },
//     {
//       title: "Support",
//       links: [
//         { name: "Help Center", href: "#" },
//         { name: "Safety", href: "#" },
//         { name: "Community Guidelines", href: "#" },
//         { name: "Contact Us", href: "#" },
//       ],
//     },
//     {
//       title: "Legal",
//       links: [
//         { name: "Terms of Service", href: "/termsandconditions" },
//         { name: "Privacy Policy", href: "/privacy-policy" },
//         { name: "Cookie Policy", href: "#" },
//         { name: "Accessibility", href: "#" },
//       ],
//     },
//   ]

//   return (
//     <footer className="bg-slate-900 text-white">
//       <div className="container px-4 md:px-6 py-12 md:py-16">
//         <div className="grid gap-8 lg:grid-cols-5">
//           <div className="lg:col-span-2">
//             <Link href="/" className="inline-block mb-6">
//               <motion.div
//                 className="text-white font-bold text-2xl"
//                 whileHover={{ scale: 1.05 }}
//                 whileTap={{ scale: 0.95 }}
//               >
//                 JobPool
//               </motion.div>
//             </Link>
//             <p className="text-slate-400 mb-6 max-w-md">
//               JobPool connects you with skilled professionals to get your tasks done efficiently. Post a task, choose
//               the best person, and get it done.
//             </p>
//             <div className="flex space-x-4">
//               <motion.a
//                 href="#"
//                 className="text-slate-400 hover:text-white transition-colors"
//                 whileHover={{ scale: 1.2 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 <Facebook className="h-5 w-5" />
//                 <span className="sr-only">Facebook</span>
//               </motion.a>
//               <motion.a
//                 href="#"
//                 className="text-slate-400 hover:text-white transition-colors"
//                 whileHover={{ scale: 1.2 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 <Twitter className="h-5 w-5" />
//                 <span className="sr-only">Twitter</span>
//               </motion.a>
//               <motion.a
//                 href="#"
//                 className="text-slate-400 hover:text-white transition-colors"
//                 whileHover={{ scale: 1.2 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 <Instagram className="h-5 w-5" />
//                 <span className="sr-only">Instagram</span>
//               </motion.a>
//               <motion.a
//                 href="#"
//                 className="text-slate-400 hover:text-white transition-colors"
//                 whileHover={{ scale: 1.2 }}
//                 whileTap={{ scale: 0.9 }}
//               >
//                 <Linkedin className="h-5 w-5" />
//                 <span className="sr-only">LinkedIn</span>
//               </motion.a>
//             </div>
//           </div>

//           {footerLinks.map((group, groupIndex) => (
//             <div key={groupIndex}>
//               <h3 className="font-semibold text-lg mb-4">{group.title}</h3>
//               <ul className="space-y-3">
//                 {group.links.map((link, linkIndex) => (
//                   <li key={linkIndex}>
//                     <Link href={link.href} className="text-slate-400 hover:text-white transition-colors">
//                       {link.name}
//                     </Link>
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           ))}

//           <div>
//             <h3 className="font-semibold text-lg mb-4">Subscribe to our newsletter</h3>
//             <p className="text-slate-400 mb-4">Get the latest news and updates</p>
//             <div className="flex gap-2">
//               <Input type="email" placeholder="Enter your email" className="bg-slate-800 border-slate-700 text-white" />
//               <Button className="bg-blue-600 hover:bg-blue-700">
//                 <ArrowRight className="h-4 w-4" />
//               </Button>
//             </div>
//           </div>
//         </div>

//         <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
//           <p className="text-slate-400 text-sm">© {new Date().getFullYear()} JobPool. All rights reserved.</p>
//           <div className="flex gap-4 mt-4 md:mt-0">
//             <Link href="#" className="text-slate-400 hover:text-white text-sm">
//               Privacy
//             </Link>
//             <Link href="#" className="text-slate-400 hover:text-white text-sm">
//               Terms
//             </Link>
//             <Link href="#" className="text-slate-400 hover:text-white text-sm">
//               Cookies
//             </Link>
//           </div>
//         </div>
//       </div>
//     </footer>
//   )
// }
"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Badge } from "../ui/badge";

export function Footer() {
  const footerLinks = [
    {
      title: "Company",
      links: [
        { name: "About us", href: "/aboutus" },
      ],
    },
    {
      title: "Support",
      links: [
        { name: "Contact Us", href: "/support" },
      ],
    },
    {
      title: "Legal",
      links: [
        { name: "Terms of Service", href: "/termsandconditions" },
        { name: "Privacy Policy", href: "/privacy-policy" },
      ],
    },
  ];

  return (
    <footer className="bg-slate-900 text-white">
      <div className="w-full px-4 md:px-6 lg:px-8 xl:px-12 2xl:px-16 py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-4">
          <div className="flex flex-col">
            <Link href="/" className="inline-block mb-6">
              <motion.div
                className="flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="bg-white rounded-lg p-2 md:p-3 shadow-lg">
                  <img 
                    src="/images/new-logo.png" 
                    alt="JobPool Logo" 
                    className="h-14 md:h-16 w-auto"
                  />
                </div>
              </motion.div>
            </Link>
            <p className="text-slate-400 mb-6 max-w-md">
              JobPool connects you with skilled professionals to get your tasks done efficiently. Post a task, choose
              the best person, and get it done.
            </p>
            <div className="flex space-x-4">
              <motion.a
                href="https://www.facebook.com/people/Job-Pool-India/100095047053131/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </motion.a>
              <motion.a
                href="https://x.com/jobpoolindia?s=21"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </motion.a>
              <motion.a
                href="https://www.instagram.com/jobpool_bharat/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </motion.a>
              <motion.a
                href="https://www.linkedin.com/company/job-pool/posts/?feedView=all"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              >
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </motion.a>
            </div>
          </div>

          {footerLinks.map((group, groupIndex) => (
            <div key={groupIndex} className="flex flex-col">
              <h3 className="font-semibold text-lg mb-4">{group.title}</h3>
              <ul className="space-y-3">
                {group.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link href={link.href} className="text-slate-400 hover:text-white transition-colors">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="flex flex-col">
            <h3 className="font-semibold text-lg mb-4">
              Get the App <Badge>Coming Soon</Badge>
            </h3>
            <div className="relative">
              <Image
                src="/images/mobileapp.png"
                alt="Download JobPool mobile app"
                width={150}
                height={50}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <p className="text-white text-sm font-semibold">© 2023 Klughire Pvt Limited. All rights reserved.</p>
            <p className="mt-1.5 text-sm font-semibold text-blue-400">A product by Klughire®</p>
            <p className="mt-2 text-xs text-slate-500">8-3-169/60/438, Indira Nagar Colony Road, Yousufguda, Hyderabad, Telangana, 500045, India</p>
          </div>
          <div className="flex gap-4 mt-4 md:mt-0">
            <Link href="/privacy-policy" className="text-slate-400 hover:text-white text-sm">
              Privacy
            </Link>
            <Link href="/termsandconditions" className="text-slate-400 hover:text-white text-sm">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
