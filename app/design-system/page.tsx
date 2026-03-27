"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SidebarNav } from "@/components/ui/SidebarNav";
import {
  Home,
  Users,
  Calendar,
  Settings,
  Activity,
  Search,
  Mail
} from "lucide-react";

export default function DesignSystemPage() {
  const navItems = [
    { icon: Home, label: "Overview", href: "#", active: true },
    { icon: Activity, label: "Recommendations", href: "#" },
    { icon: Users, label: "Patients", href: "#" },
    { icon: Calendar, label: "Schedule", href: "#" },
    { icon: Settings, label: "Settings", href: "#" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <SidebarNav items={navItems} />

      {/* Main Content Showcase */}
      <main className="flex-1 p-10 max-w-5xl mx-auto overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-heading font-medium text-near-black tracking-tight mb-2">
            Ruby Pulse Design System
          </h1>
          <p className="text-gray-500 text-[15px]">
            Showcase of reusable UI components and design tokens.
          </p>
        </header>

        {/* Buttons Section */}
        <section className="mb-12">
          <h2 className="text-xl font-heading font-medium text-near-black mb-6 border-b border-[#E5E7EB] pb-2">
            Buttons
          </h2>
          <div className="flex flex-wrap items-center gap-4 bg-white p-6 rounded-card border border-[#E5E7EB]">
            <Button variant="primary">Primary Action</Button>
            <Button variant="secondary">Secondary Action</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger Action</Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </section>

        {/* Badges Section */}
        <section className="mb-12">
          <h2 className="text-xl font-heading font-medium text-near-black mb-6 border-b border-[#E5E7EB] pb-2">
            Status Badges
          </h2>
          <div className="flex flex-wrap items-center gap-4 bg-white p-6 rounded-card border border-[#E5E7EB]">
            <Badge variant="pending">Pending</Badge>
            <Badge variant="matched">Matched</Badge>
            <Badge variant="booked">Booked</Badge>
            <Badge variant="completed">Completed</Badge>
            <Badge variant="cancelled">Cancelled</Badge>
            <Badge variant="urgent">Urgent</Badge>
            <Badge variant="default">Default</Badge>
          </div>
        </section>

        {/* Form Elements Section */}
        <section className="mb-12">
          <h2 className="text-xl font-heading font-medium text-near-black mb-6 border-b border-[#E5E7EB] pb-2">
            Forms & Inputs
          </h2>
          <div className="grid grid-cols-2 gap-8 bg-white p-8 rounded-card border border-[#E5E7EB]">
            <div>
              <Label required>Standard Input</Label>
              <Input placeholder="Enter patient name..." />
            </div>
            <div>
              <Label hint="(Optional)">Email Address</Label>
              <Input
                type="email"
                placeholder="patient@example.com"
                prefixNode={<Mail className="w-4 h-4" />}
              />
            </div>
            <div className="col-span-2">
              <Label required>Search Query</Label>
              <Input
                placeholder="Search recommendations or blood collectors..."
                prefixNode={<Search className="w-4 h-4" />}
                suffixNode={<span className="text-[12px] opacity-70">⌘K</span>}
              />
            </div>
          </div>
        </section>

        {/* Cards Section */}
        <section className="mb-12">
          <h2 className="text-xl font-heading font-medium text-near-black mb-6 border-b border-[#E5E7EB] pb-2">
            Cards
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-heading font-medium text-near-black text-lg">
                    Recommendation #4092
                  </h3>
                  <p className="text-[13px] text-gray-500 mt-1">
                    Fasting blood draw required.
                  </p>
                </div>
                <Badge variant="urgent">Urgent</Badge>
              </div>
              <div className="pt-4 border-t border-[#E5E7EB] flex justify-end gap-3 mt-6">
                <Button variant="ghost">View Details</Button>
                <Button variant="primary">Match BC</Button>
              </div>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-heading font-medium text-primary-dark text-lg">
                    System Alert
                  </h3>
                  <p className="text-[13px] text-near-black/80 mt-1">
                    3 recommendations are waiting for matching beyond 24h.
                  </p>
                </div>
                <Badge variant="pending">Action Needed</Badge>
              </div>
              <div className="pt-4 flex justify-start mt-6">
                <Button variant="secondary" className="border-primary/30 text-primary-dark bg-white hover:bg-primary/10">
                  Review Recommendations
                </Button>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
