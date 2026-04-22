import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="flex justify-between items-center p-4 bg-white shadow">
        <h1 className="text-xl font-bold text-blue-600">Attendify</h1>

        <div className="space-x-4">
          <Link href="/login" className="text-gray-700 hover:text-blue-600">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center text-center mt-20 px-6">

        <h2 className="text-4xl font-bold text-gray-800">
          Smart Attendance System
        </h2>

        <p className="mt-4 text-gray-600 max-w-xl">
          Automated attendance tracking using WiFi and ESP32.
          No manual marking, no errors — just seamless tracking.
        </p>

        <Link
          href="/login"
          className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Get Started
        </Link>

      </div>

      {/* Features */}
      <div className="grid grid-cols-3 gap-6 mt-20 px-10">

        <div className="bg-white p-6 rounded shadow text-center">
          <h3 className="font-semibold">Automatic Detection</h3>
          <p className="text-gray-500 text-sm mt-2">
            Detect students via WiFi connection
          </p>
        </div>

        <div className="bg-white p-6 rounded shadow text-center">
          <h3 className="font-semibold">Real-time Attendance</h3>
          <p className="text-gray-500 text-sm mt-2">
            Attendance marked instantly
          </p>
        </div>

        <div className="bg-white p-6 rounded shadow text-center">
          <h3 className="font-semibold">Analytics & Reports</h3>
          <p className="text-gray-500 text-sm mt-2">
            View and download reports anytime
          </p>
        </div>

      </div>

    </div>
  )
}