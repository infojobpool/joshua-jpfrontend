"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Section {
  id: string;
  title: string;
}

const PrivacyPolicy: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("");

  const sections: Section[] = [
    { id: "introduction", title: "Introduction" },
    { id: "applicability", title: "1. Applicability of the Policy" },
    { id: "collection", title: "2. Collection of the Information" },
    { id: "use", title: "3. Use of the Information" },
    { id: "sharing", title: "4. Sharing of the Information" },
    { id: "third-party", title: "5. Third Party Links and Services" },
    { id: "anonymous", title: "6. Anonymous or De-identified Data" },
    { id: "cookies", title: "7. Cookies" },
    { id: "security", title: "8. Security Precautions" },
    { id: "permissible-age", title: "9. Permissible Age" },
    { id: "data-retention", title: "10. Data Retention" },
    { id: "job-applicants", title: "11. Job Applicants" },
    { id: "consent", title: "12. Your Consent" },
    { id: "changes", title: "13. Changes to this Privacy Policy" },
    { id: "grievance", title: "14. Grievance Officer" },
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
          Privacy Policy
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
                    before accessing or using the Platform. These Terms, along
                    with the Privacy Policy published on the Platform ("Privacy
                    Policy") and other policies (as may be
                    notified/displayed/published on the Platform), constitute the
                    contract between the Users of this Platform and the Company
                    (collectively "Agreement"). By use of the Platform, Users
                    agree to be bound by this Agreement as posted on the Platform
                    from time to time.
                  </p>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    The Application of Jobpool is a connecting medium for both
                    task providers and professionals to connect. The application
                    offers various services for both parties based on their
                    interests. The Application also follows the guidelines of
                    different countries and communities. The organization handles
                    privacy and holds payments safely until the work is completed
                    for both providers and professionals under the privacy acts
                    issued by different countries.
                  </p>
                  <ul className="mt-4 list-decimal pl-6 text-gray-600">
                    <li>
                      Jobpool is an application providing an online workspace
                      ("Application") where registered skilled professionals can
                      offer their services to registered Users.
                    </li>
                    <li>
                      The Application and website at{" "}
                      <a
                        href="https://jobpool.in"
                        className="text-blue-600 hover:underline"
                      >
                        jobpool.in
                      </a>{" "}
                      ("Website") (collectively, "Platform") are operated by SHILO
                      WEB DEVELOPMENT, a rapidly growing software development
                      company and/or its affiliates (hereinafter referred to as
                      the “Company”, “we”, “us”, and “our”). We respect your
                      privacy and are committed to protecting it through
                      compliance with our privacy policy.
                    </li>
                  </ul>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    This policy describes:
                    <ul className="list-disc pl-6">
                      <li>
                        The type of information the Company may collect from you
                        when you access or use its websites, applications, and
                        other online services (collectively, “Services”);
                      </li>
                      <li>
                        The Company’s practices for collecting, using,
                        maintaining, protecting, and disclosing that information.
                      </li>
                    </ul>
                  </p>
                  <p className="mt-4 text-gray-600 leading-relaxed">
                    We encourage you to read this policy carefully to understand
                    our policies and practices regarding your information. By
                    accessing or using our Services or Platform, registering an
                    account, becoming a supplier or customer, or attempting to do
                    so, you expressly agree to be bound by this privacy policy and
                    consent to the Company’s collection, use, disclosure, and
                    retention of your personal information as described here. This
                    policy may change from time to time; your continued use of the
                    Services after changes constitutes acceptance, so please check
                    periodically for updates.
                  </p>
                </section>

                <section id="applicability" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    1. Applicability of the Policy
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>1.1</strong> This policy applies only to information
                    collected through our Services, including email, text, and
                    other electronic communications sent through or in connection
                    with our Services.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>1.2</strong> This Policy does not apply to information
                    provided to or collected by third parties used in connection
                    with our services. We encourage you to consult directly with
                    such third parties about their privacy practices.
                  </p>
                </section>

                <section id="collection" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    2. Collection of the Information
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>2.1</strong> Some Services may be used without
                    revealing personal information, while others require it. We
                    may collect ‘Non-Personal Information’ (e.g., web pages
                    viewed) that cannot identify you. For certain features, you
                    may need to submit ‘Personally Identifiable Information’ (e.g.,
                    name, email). Inaccurate information may affect your ability
                    to use Services or our ability to contact you. You are
                    responsible for ensuring the accuracy of the information you
                    submit.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.2</strong> We collect several types of information,
                    including:
                    <ul className="list-disc pl-6">
                      <li>
                        <strong>Personally Identifiable Information</strong>:
                        Information like name, email, contact number,
                        educational qualifications, occupation, date of birth,
                        marital status, income, residence, Aadhaar number, PAN,
                        social security, tax identification numbers, and work
                        experience.
                      </li>
                      <li>
                        Information about your internet connection, equipment, and
                        usage details.
                      </li>
                    </ul>
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.3</strong> We collect this information:
                    <ul className="list-disc pl-6">
                      <li>Directly from you when provided.</li>
                      <li>
                        Automatically as you navigate our Services (e.g., usage
                        details, IP addresses, cookies).
                      </li>
                      <li>
                        From third-party sources, such as updated delivery and
                        address information from carriers.
                      </li>
                    </ul>
                  </p>
                  <h3 className="mb-2 mt-4 text-xl font-medium text-gray-900">
                    2.4 Information You Provide to Us
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>2.4.1 Your Account Information</strong>: Full name,
                    email, postal code, password, gender, phone number, profile
                    picture, etc. You may provide this via third-party sign-in
                    services (e.g., Facebook, Google).
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.4.2 Your Preferences</strong>: Time zone, language
                    settings.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.4.3 Your Content</strong>: Reviews, photos,
                    comments, ordering history, favorite categories, contact
                    information, etc.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.4.4 Your Searches and Activities</strong>: Search
                    terms, results selected.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.4.5 Your Browsing Information</strong>: Duration of
                    use, features used, ads clicked.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.4.6 Your Communications</strong>: Messages with
                    users/suppliers, survey participation, newsletter requests.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.4.7 Your Transactional Information</strong>: Name,
                    phone, gender, transaction details, PAN, billing, and payment
                    information shared with PCI-compliant processors.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.4.8 Your Public Posts</strong>: Ratings, reviews,
                    photos, comments posted publicly. These are shared at your own
                    risk, as we cannot control other users’ actions.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.4.9</strong> We use this information to enhance
                    functionality, improve quality, personalize experiences,
                    display relevant ads, provide support, communicate, and comply
                    with legal obligations.
                  </p>
                  <h3 className="mb-2 mt-4 text-xl font-medium text-gray-900">
                    2.5 Information We Automatically Collect
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>2.5.1</strong> We may collect information about your
                    device and usage, even without registration.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.5.2 Usage Information</strong>: Traffic data,
                    location data, logs, resources accessed.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.5.3 Computer and Device Information</strong>: IP
                    address, operating system, browser type, device identifier,
                    network information.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.5.4 Stored Information and Files</strong>: Metadata
                    from files like photos, audio, video clips, contacts.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.5.5 Location Information</strong>: Real-time device
                    location, as permitted by you.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.5.6 Last URL Visited</strong>: The URL of the last
                    web page visited before our websites.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.5.7 Mobile Device IDs</strong>: Unique device
                    identifiers for tracking preferences and ads.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.5.8 Your Preferences</strong>: Time zone, language
                    settings.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed CHRISTOPHER">
                    <strong>2.5.9 Your Activity on the Services</strong>: Search
                    queries, comments, clicks, pages viewed, visit duration.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.5.10 Mobile Status</strong>: Online/offline status
                    of the application.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.5.11 Applications</strong>: Information about other
                    applications on your device to personalize experiences.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>2.6</strong> You may withdraw consent for collecting
                    personal information by contacting the Grievance Officer (see
                    Section 14). Withdrawal may limit our ability to provide
                    certain services.
                  </p>
                </section>

                <section id="use" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    3. Use of the Information
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    We use collected information for:
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>3.1</strong> Handling orders, processing payments,
                    communicating about orders and services.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>3.2</strong> Providing, troubleshooting, and improving
                    Services through performance analysis and usability
                    enhancements.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>3.3</strong> Recommending features, products, and
                    personalizing experiences, sharing preferences with your
                    network for marketing.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>3.4</strong> Complying with legal obligations, such as
                    verifying seller information.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>3.5</strong> Communicating via phone, email, or chat.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>3.6</strong> Displaying interest-based ads without
                    using personally identifiable information.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>3.7</strong> Preventing fraud, assessing credit risks
                    via scoring methods, and sharing results with third parties.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>3.8</strong> Administering contests and sweepstakes.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>3.9</strong> Enforcing contracts, including billing and
                    collection.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>3.10</strong> Conducting research, auditing, and
                    analyzing user behavior to improve Services.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>3.11</strong> Fulfilling purposes for which you
                    provided the information or with your consent.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>3.12</strong> Checking eligibility for credit and
                    payment products with affiliates and partners.
                  </p>
                </section>

                <section id="sharing" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    4. Sharing of the Information
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>4.1</strong> We may disclose personal information:
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>4.1.1 General Information Disclosures</strong>:
                    <ul className="list-disc pl-6">
                      <li>
                        To holding companies, subsidiaries, and affiliates under
                        common ownership.
                      </li>
                      <li>
                        To contractors, advertisers, service providers, credit
                        agencies, and other third parties bound by confidentiality
                        obligations.
                      </li>
                      <li>
                        To successors in mergers, divestitures, or asset
                        transfers.
                      </li>
                      <li>
                        To third parties marketing products or services we believe
                        may interest you.
                      </li>
                      <li>
                        These third parties are contractually required to maintain
                        confidentiality.
                      </li>
                    </ul>
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>4.1.2</strong> To fulfill the purpose for which you
                    provided it.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>4.1.3</strong> For purposes disclosed when you provided
                    the information.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>4.2 Service Providers</strong>: We share information
                    with vendors for communications, payment processing, surveys,
                    and hosting services.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>4.3 Credit Analysis</strong>: We may share information
                    with Credit Information Companies for credit checks to offer
                    payment options.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>4.4 Legal Purposes</strong>: We share information to
                    comply with legal processes, investigate illegal activities,
                    or protect rights and safety.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>4.5 Social Networks</strong>: Social media interactions
                    may collect or post information, governed by their privacy
                    policies.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>4.6</strong> To enforce Terms of Use and agreements.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>4.7</strong> To protect the Company, users, or others,
                    including for fraud protection and credit risk reduction.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>4.8</strong> With your consent.
                  </p>
                </section>

                <section id="third-party" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    5. Third Party Links and Services
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>5.1</strong> Services may link to third-party websites.
                    We are not responsible for their content or privacy practices.
                    Our Privacy Policy does not cover information provided to or
                    collected by third parties. Read their privacy policies.
                  </p>
                </section>

                <section id="anonymous" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    6. Anonymous or De-identified Data
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>6.1</strong> We may anonymize or de-identify
                    information, which is not restricted by this Policy and may be
                    used or disclosed without limitation.
                  </p>
                </section>

                <section id="cookies" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    7. Cookies
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>7.1</strong> Cookies are alphanumeric identifiers
                    stored on your device. We use cookies for features and to
                    collect information. Third-party websites may place cookies,
                    for which we are not responsible. We use third-party cookies
                    for marketing.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>7.2</strong> We provide choices regarding personal
                    information you provide.
                  </p>
                </section>

                <section id="security" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    8. Security Precautions
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>8.1</strong> We maintain reasonable safeguards to
                    protect your information, using industry-standard security
                    measures. However, data transmission over the internet carries
                    inherent risks, and we cannot guarantee complete security.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>8.2</strong> We are not liable for disclosure due to
                    errors or unauthorized access beyond our control. Do not share
                    your username or password. Instructions using your credentials
                    are considered authorized by you.
                  </p>
                </section>

                <section id="permissible-age" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    9. Permissible Age
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>9.1</strong> Services are not intended for users under
                    18 unless permitted by local laws. We do not knowingly collect
                    information from minors.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>9.2</strong> Minors must use Services under parental
                    supervision. We delete accounts of users under 18 upon
                    discovery.
                  </p>
                </section>

                <section id="data-retention" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    10. Data Retention
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>10.1</strong> You may close your account or request
                    deletion via the Grievance Officer. We retain information as
                    required by law or for authorized purposes, then delete or
                    anonymize it.
                  </p>
                </section>

                <section id="job-applicants" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    11. Job Applicants
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>11.1</strong> Job applicant information is used to
                    evaluate applications and may be shared with third parties for
                    qualification assessments.
                  </p>
                </section>

                <section id="consent" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    12. Your Consent
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>12.1</strong> By using Services or providing
                    information, you consent to its collection, use, storage, and
                    disclosure per this Policy. You represent authority to provide
                    others’ information.
                  </p>
                  <p className="mt-2 text-gray-600 leading-relaxed">
                    <strong>12.2</strong> You consent to contact via SMS, calls, or
                    email by us, affiliates, and partners for purposes in this
                    Policy.
                  </p>
                </section>

                <section id="changes" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    13. Changes to this Privacy Policy
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>13.1</strong> We may amend this Policy to reflect
                    changes in law, practices, or technology. Check periodically
                    for updates. Continued use after changes constitutes
                    acceptance.
                  </p>
                </section>

                <section id="grievance" className="mb-8">
                  <h2 className="mb-4 text-2xl font-semibold text-gray-900">
                    14. Grievance Officer
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    <strong>14.1</strong> Per the Information Technology Act, 2000,
                    and related rules, contact details of the Grievance Officer
                    are provided below: [Details to be inserted by the Company].
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

export default PrivacyPolicy;