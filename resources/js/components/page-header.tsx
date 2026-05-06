import * as React from "react"

import { cn } from "@/lib/utils"

function Header({
  title,
  description,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  title: string
  description?: string
}) {
  return (
    <div
      data-slot="page-header"
      className={cn(
        "flex flex-col gap-1 border-b px-6 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </div>
  )
}

export { Header }
