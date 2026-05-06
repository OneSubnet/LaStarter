"use client"

import * as React from "react"
import {
  Root as ScrollAreaRoot,
  Viewport as ScrollAreaViewportPrimitive,
  Scrollbar as ScrollAreaScrollbarPrimitive,
  Thumb as ScrollAreaThumbPrimitive,
  Corner as ScrollAreaCornerPrimitive,
} from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaRoot>) {
  return (
    <ScrollAreaRoot
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaViewportPrimitive
        data-slot="scroll-area-viewport"
        className="size-full rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1"
      >
        {children}
      </ScrollAreaViewportPrimitive>
      <ScrollBar />
      <ScrollAreaCornerPrimitive />
    </ScrollAreaRoot>
  )
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof ScrollAreaScrollbarPrimitive>) {
  return (
    <ScrollAreaScrollbarPrimitive
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        "flex touch-none p-px transition-colors select-none",
        orientation === "vertical" &&
          "h-full w-2.5 border-l border-l-transparent",
        orientation === "horizontal" &&
          "h-2.5 flex-col border-t border-t-transparent",
        className
      )}
      {...props}
    >
      <ScrollAreaThumbPrimitive
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-border"
      />
    </ScrollAreaScrollbarPrimitive>
  )
}

export { ScrollArea, ScrollBar }
