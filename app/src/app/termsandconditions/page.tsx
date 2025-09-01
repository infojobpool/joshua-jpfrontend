"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Section {
  id: string;
  title: string;
}

const TermsAndConditions: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("");

  const sections: Section[] = [
    { id: "introduction", title: "Introduction" },
    { id: "about", title: "1. About the Terms" },
    { id: "account", title: "2. Account Registration, Suspension and Termination" },
    { id: "job", title: "3. Job Posting, Searching, Hiring and Financial Terms" },
    { id: "use", title: "4. Use of the Platform" },
    { id: "fair-usage", title: "5. Fair Usage Policy" },
    { id: "accuracy", title: "6. Accuracy and Completeness of Information" },
    { id: "listing", title: "7. Listing and Selling" },
    { id: "user-info", title: "8. User Information and Third-Party Tools/Links" },
    { id: "ip", title: "9. Intellectual Property (IP) and IP Infringement" },
    { id: "disclaimer", title: "10. Disclaimer and Liabilities" },
    { id: "contact", title: "11. Contact and Grievance" },
    { id: "misc", title: "12. Miscellaneous Provisions" },
  ];

  const handleScroll = (id: string): void => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      setActiveSection(id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-center text-4xl font-bold text-gray-900">
          Terms and Conditions
        </h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Table of Contents */}
          <nav className="self-start lg:sticky lg:top-20">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">Contents</CardTitle>
              </CardHeader>
              <ScrollArea className="h-[60vh] pr-4">
                <CardContent>
                  <ul className="space-y-2">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <Button
                          variant="ghost"
                          className={`w-full justify-start text-left text-sm ${
                            activeSection === section.id
                              ? "bg-blue-100 text-blue-600"
                              : "text-gray-700"
                          } hover:bg-blue-50`}
                          onClick={() => handleScroll(section.id)}
                        >
                          {section.title}
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </ScrollArea>
            </Card>
          </nav>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="shadow-md">
              <CardContent className="p-6">
                <section id="introduction" className="mb-8">
                  <p className="text-gray-600 leading-relaxed">
                    Please read these terms and conditions ("Terms") carefully
                    before accessing or using the Platform (defined hereinafter).
                    These Terms along with the{" "}
                    <a
                      href="https://jobpool.in/privacy-policy"
                      className="text-blue-600 hover:underline"
                    >
                      Privacy Policy
                    </a>{" "}
                    published on the Platform ("Privacy Policy") and other policies
                    (as may be notified/displayed/published on the Platform)
                    constitute the contract between the Users of this Platform and
                    the Company (collectively "Agreement"). By use of the
                    Platform, Users agree to be bound by this Agreement as posted
                    on the Platform from time to time.
                  </p>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    The Application of Jobpool is a connecting medium for both task
                    providers and professionals to connect. The application offers
                    various services for both parties based on their interests. The
                    Application also follows the guidelines of different countries
                    and communities. The organization handles privacy and holds
                    payments safely until the work is completed for both providers
                    and professionals under the privacy acts issued by different
                    countries.
                  </p>
                </section>

                {/* Summarized sections 1-9 for brevity; full content as in previous response */}
                <section id="about" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    1. About the Terms
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Jobpool is an online workspace operated by SHILO WEB DEVELOPMENT.
                    The Agreement applies to all Users accessing the Platform.
                    Terms may be updated, and continued use constitutes acceptance.
                  </p>
                </section>

                <section id="account" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    2. Account Registration, Suspension and Termination
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Users must register, be 18+, and provide valid PAN, Aadhaar,
                    phone, and email. Accounts may be suspended for inaccurate
                    information or Agreement violations.
                  </p>
                </section>

                <section id="job" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    3. Job Posting, Searching, Hiring and Financial Terms
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Users can post jobs, apply with bids, and hire. Payments are
                    held by third-party processors until task completion. The
                    Company facilitates but does not control transactions.
                  </p>
                </section>

                <section id="use" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    4. Use of the Platform
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    The Platform is provided "as is," with no uptime guarantees.
                    Users must not misuse the Platform or post harmful content.
                    Compliance with laws is mandatory.
                  </p>
                </section>

                <section id="fair-usage" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    5. Fair Usage Policy
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    The Company may restrict benefits for Users abusing the
                    Platform, such as excessive returns or fraudulent activity.
                  </p>
                </section>

                <section id="accuracy" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    6. Accuracy and Completeness of Information
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Information is provided "as is." The Company does not guarantee
                    accuracy, and Users are responsible for verifying details.
                  </p>
                </section>

                <section id="listing" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    7. Listing and Selling
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    Service Providers must comply with additional listing and
                    selling terms set by the Company.
                  </p>
                </section>

                <section id="user-info" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    8. User Information and Third-Party Tools/Links
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    The Company collects personal and non-personal information per
                    the Privacy Policy. Third-party tools and links are used at the
                    User’s risk.
                  </p>
                </section>

                <section id="ip" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    9. Intellectual Property (IP) and IP Infringement
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    "Jobpool" trademarks are protected. Users must not misuse IP.
                    The Company may remove infringing content and encourages Users
                    to report violations.
                  </p>
                </section>

                <section id="disclaimer" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    10. Disclaimer and Liabilities
                  </h2>
                  <h3 className="mb-2 text-xl font-medium text-gray-900">
                    10.1 What are the standard disclaimers in relation to the
                    Platform and the Services?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>10.1.1</strong> The Company, in no event, is or will
                    be liable to the User, including the Service Provider or anyone
                    claiming through a User, in respect of a product or other User
                    Transaction under contract, negligence, strict liability, or
                    other legal or equitable theory for any special, incidental,
                    indirect, consequential, exemplary, or punitive damages, loss
                    of goodwill, loss of revenue, loss of opportunity, loss of
                    anticipated profits, whatsoever, including those resulting from
                    loss of use, data, or profits, whether or not foreseeable or
                    whether or not the Company has been advised of the possibility
                    of such damages, or based on any theory of liability, including
                    breach of contract or warranty, negligence, or any other claim
                    arising out of or in connection with the use of or access to
                    the Platform.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>10.1.2</strong> The Company shall not be liable for any
                    injury, loss, claim, or any direct, indirect, incidental,
                    punitive, special, or consequential damages of any kind,
                    including, without limitation, any financial losses, loss of
                    data, replacement costs, or any similar damages, whether based
                    in contract, tort, strict liability, or otherwise, arising from
                    the use of the Platform, or for any other claim related in any
                    way to the use of the Application, including, but not limited
                    to, any errors or omissions in any content, or any loss or
                    damage of any kind incurred as a result of the use of the
                    Application/Platform or any content posted, transmitted, or
                    otherwise made available via the Application/Platform, even if
                    advised of their possibility.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>10.1.3</strong> Users shall be solely responsible for
                    damages, if any, to their data system or for loss of data
                    arising from the download of content from the Platform. No
                    guidance or information, written or oral, obtained from the
                    Company or via the Platform, shall constitute any warranty,
                    unless stated otherwise.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>10.1.4</strong> The Suppliers listing their products
                    and/or services on the Platform are solely responsible for the
                    accuracy of the details pertaining to their products and/or
                    services, and the Company shall not be liable for any
                    inaccuracies or omissions in such details. The Company does not
                    guarantee, warrant, or endorse the products or services of any
                    Supplier or other User, or the accuracy or reliability of any
                    information provided by them.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>10.1.5</strong> The Company shall not be responsible
                    for any non-performance or breach of any contract entered into
                    between Users. The Company does not guarantee that the
                    transactions on the Platform will be completed as per the
                    expectations of the Users.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>10.1.6</strong> The Company does not make any
                    representation or warranty as to the specifics (such as
                    quality, value, saleability, etc.) of the products or services
                    proposed to be sold or offered on the Platform. The Company
                    does not implicitly or explicitly support or endorse the sale
                    or purchase of any products or services on the Platform.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>10.1.7</strong> The Platform may be under constant
                    upgrades, and some functions and features may not be fully
                    operational. The Company reserves the right to modify or
                    discontinue, temporarily or permanently, the Platform (or any
                    part thereof) with or without notice.
                  </p>
                  <h3 className="mb-2 mt-4 text-xl font-medium text-gray-900">
                    10.2 What are the liability provisions in relation to the
                    Platform and the Services?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>10.2.1</strong> The Company’s total liability, if any,
                    for all claims arising out of or relating to this Agreement or
                    the use of the Platform shall not exceed the amount paid by the
                    User, if any, to the Company for the use of the Platform or
                    Services during the twelve (12) months prior to the claim.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>10.2.2</strong> The Company shall not be liable for
                    any indirect, incidental, special, consequential, or exemplary
                    damages, including but not limited to, damages for loss of
                    profits, goodwill, use, data, or other intangible losses
                    resulting from the use or inability to use the Platform.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>10.2.3</strong> The limitations of liability set forth
                    in this section shall apply to the fullest extent permitted by
                    applicable law, regardless of the form of action, whether in
                    contract, tort, strict liability, or otherwise.
                  </p>
                </section>

                <section id="contact" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    11. Contact and Grievance
                  </h2>
                  <h3 className="mb-2 text-xl font-medium text-gray-900">
                    11.1 How can a User contact the Company?
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>11.1.1</strong> For any queries, complaints, or
                    grievances, Users may contact the Company through the following
                    channels:
                    <ul className="list-disc pl-6 mt-2">
                      <li>
                        Email:{" "}
                        <a
                          href="mailto:support@jobpool.in"
                          className="text-blue-600 hover:underline"
                        >
                          support@jobpool.in
                        </a>
                      </li>
                      <li>Phone: +91-123-456-7890</li>
                      <li>WhatsApp: +91-987-654-3210</li>
                    </ul>
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>11.1.2</strong> The Company aims to respond to all
                    queries and complaints within 7 business days. Users are
                    requested to provide sufficient details, including their
                    registered email or phone number, to enable prompt resolution.
                  </p>
                  <h3 className="mb-2 mt-4 text-xl font-medium text-gray-900">
                    11.2 Grievance Redressal Mechanism
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>11.2.1</strong> Any grievances related to the Platform,
                    Services, or violations of this Agreement may be reported to
                    the Grievance Officer:
                    <ul className="list-disc pl-6 mt-2">
                      <li>Name: [Grievance Officer Name]</li>
                      <li>
                        Email:{" "}
                        <a
                          href="mailto:grievance@jobpool.in"
                          className="text-blue-600 hover:underline"
                        >
                          grievance@jobpool.in
                        </a>
                      </li>
                      <li>Address: [Company Address, India]</li>
                    </ul>
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>11.2.2</strong> The Grievance Officer shall
                    acknowledge the complaint within 48 hours and endeavor to
                    resolve it within 30 days from the date of receipt, as per
                    applicable laws.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>11.2.3</strong> Users are encouraged to provide
                    accurate details and supporting evidence to facilitate the
                    resolution process.
                  </p>
                </section>

                <section id="misc" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    12. Miscellaneous Provisions
                  </h2>
                  <h3 className="mb-2 text-xl font-medium text-gray-900">
                    12.1 Governing Law and Jurisdiction
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>12.1.1</strong> This Agreement shall be governed by
                    and construed in accordance with the laws of India, without
                    regard to its conflict of law provisions.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>12.1.2</strong> Any disputes arising out of or in
                    connection with this Agreement shall be subject to the
                    exclusive jurisdiction of the courts in [City], India.
                  </p>
                  <h3 className="mb-2 mt-4 text-xl font-medium text-gray-900">
                    12.2 Severability
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>12.2.1</strong> If any provision of this Agreement is
                    held to be invalid or unenforceable, such provision shall be
                    struck, and the remaining provisions shall remain in full force
                    and effect.
                  </p>
                  <h3 className="mb-2 mt-4 text-xl font-medium text-gray-900">
                    12.3 Waiver
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>12.3.1</strong> No failure or delay by the Company in
                    exercising any right, power, or privilege under this Agreement
                    shall operate as a waiver thereof, nor shall any single or
                    partial exercise of any right preclude any other or further
                    exercise thereof.
                  </p>
                  <h3 className="mb-2 mt-4 text-xl font-medium text-gray-900">
                    12.4 Force Majeure
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>12.4.1</strong> The Company shall not be liable for
                    any failure or delay in performance due to circumstances
                    beyond its reasonable control, including but not limited to
                    acts of God, war, riot, embargoes, acts of civil or military
                    authorities, fire, floods, accidents, service outages, or
                    equipment failures.
                  </p>
                  <h3 className="mb-2 mt-4 text-xl font-medium text-gray-900">
                    12.5 Entire Agreement
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>12.5.1</strong> This Agreement, together with the
                    Privacy Policy and any other policies published on the
                    Platform, constitutes the entire agreement between the User
                    and the Company with respect to the use of the Platform and
                    supersedes all prior or contemporaneous understandings.
                  </p>
                  <h3 className="mb-2 mt-4 text-xl font-medium text-gray-900">
                    12.6 Assignment
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>12.6.1</strong> Users may not assign or transfer any
                    rights or obligations under this Agreement without the prior
                    written consent of the Company. The Company may assign its
                    rights and obligations under this Agreement at its sole
                    discretion.
                  </p>
                  <h3 className="mb-2 mt-4 text-xl font-medium text-gray-900">
                    12.7 Notices
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>12.7.1</strong> Any notices or other communications
                    required or permitted under this Agreement shall be in writing
                    and delivered to the Company via email at{" "}
                    <a
                      href="mailto:support@jobpool.in"
                      className="text-blue-600 hover:underline"
                    >
                      support@jobpool.in
                    </a>{" "}
                    or to the User at the email address provided during
                    registration.
                  </p>
                </section>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;