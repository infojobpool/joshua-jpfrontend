import Link from "next/link";

/** Stops 404 on prefetch / RSC for `/support` from the admin layout footer. */
export default function AdminSupportStubPage() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-slate-900">Support</h1>
      <p className="text-sm text-slate-600">
        For admin or platform help, use your internal support channel or site owner contact.
      </p>
      <p>
        <Link href="/" className="text-sm font-medium text-blue-700 hover:underline">
          Back to admin login
        </Link>
      </p>
    </div>
  );
}
