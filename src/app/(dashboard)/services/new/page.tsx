"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { useCreateService } from "@/hooks/useServices"
import ServiceForm from "@/components/services/ServiceForm"
import type { ServiceFormValues } from "@/components/services/ServiceForm"

export default function NewServicePage() {
  const router = useRouter()
  const createService = useCreateService()

  function handleSubmit(data: ServiceFormValues) {
    createService.mutate(data, {
      onSuccess: () => {
        toast.success("Service created successfully")
        router.push("/services")
      },
      onError: (err) => {
        toast.error(err.message)
      },
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/services"
          className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-input bg-background hover:bg-accent transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Add Service</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure a new service to monitor
          </p>
        </div>
      </div>

      <ServiceForm
        onSubmit={handleSubmit}
        isLoading={createService.isPending}
        submitLabel="Add Service"
      />
    </div>
  )
}
