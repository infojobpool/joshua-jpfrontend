"use client";

import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export function DigilockerWalkthrough() {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4">
      <h4 className="text-sm font-semibold text-gray-900">
        First time or documents not linked?
      </h4>
      <p className="mt-1 text-xs text-gray-600">
        JobPool uses official DigiLocker (government). You&apos;ll leave this app
        briefly, then return here when done.
      </p>

      <Accordion type="single" collapsible className="mt-3 w-full">
        <AccordionItem value="have-account" className="border-blue-100">
          <AccordionTrigger className="py-3 text-left text-sm font-medium hover:no-underline">
            I already have DigiLocker
          </AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal space-y-2 pl-4 text-sm text-gray-700">
              <li>Tap <strong>Continue with DigiLocker</strong> below.</li>
              <li>
                On the next page, choose <strong>Sign In</strong> and enter the
                mobile number linked to your DigiLocker account.
              </li>
              <li>Complete OTP or PIN if asked.</li>
              <li>
                When Cashfree asks, approve sharing <strong>PAN</strong> and{" "}
                <strong>Aadhaar</strong> with JobPool.
              </li>
              <li>
                You&apos;ll be sent back to JobPool automatically — wait for the
                success screen.
              </li>
            </ol>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="new-account" className="border-blue-100">
          <AccordionTrigger className="py-3 text-left text-sm font-medium hover:no-underline">
            I don&apos;t have a DigiLocker account
          </AccordionTrigger>
          <AccordionContent>
            <ol className="list-decimal space-y-2 pl-4 text-sm text-gray-700">
              <li>
                Tap <strong>New user? Start with Sign up</strong> below (or Sign
                up on the DigiLocker page after Continue).
              </li>
              <li>
                Register with your <strong>Aadhaar-linked mobile number</strong>{" "}
                and complete OTP.
              </li>
              <li>Set your DigiLocker security PIN when prompted.</li>
              <li>
                In DigiLocker, add your documents: open the DigiLocker app or{" "}
                <Link
                  href="https://www.digilocker.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  digilocker.gov.in
                </Link>
                , then fetch <strong>Aadhaar</strong> and <strong>PAN</strong>{" "}
                from the issuers (UIDAI / Income Tax).
              </li>
              <li>
                Return to JobPool verification and tap{" "}
                <strong>Continue with DigiLocker</strong> again to share them
                with us.
              </li>
            </ol>
            <p className="mt-2 text-xs text-gray-600">
              First-time setup usually takes about 10–20 minutes.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="not-linked" className="border-blue-100">
          <AccordionTrigger className="py-3 text-left text-sm font-medium hover:no-underline">
            DigiLocker login works but PAN / Aadhaar won&apos;t share
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc space-y-2 pl-4 text-sm text-gray-700">
              <li>
                Both documents must appear in your DigiLocker wallet before
                JobPool can verify you.
              </li>
              <li>
                In the app: <strong>Search documents</strong> → get Aadhaar from
                UIDAI and PAN from ITD.
              </li>
              <li>
                Use the same name and mobile as on your JobPool profile where
                possible.
              </li>
              <li>
                After they show in DigiLocker, start verification again from
                JobPool (links expire in about 10 minutes).
              </li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cant-use" className="border-blue-100 border-b-0">
          <AccordionTrigger className="py-3 text-left text-sm font-medium hover:no-underline">
            I can&apos;t use DigiLocker right now
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-gray-700">
              Use <strong>Skip for now</strong> at the bottom of this page. Some
              features (such as welcome bonus payout) stay limited until
              verification is complete. For help, contact JobPool support from
              the Contact page with your registered email.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
