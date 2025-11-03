import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'

/**
 * Custom render con providers necesarios
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <DndContext>
      {children}
    </DndContext>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

