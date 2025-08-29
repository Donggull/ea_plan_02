import type { Meta, StoryObj } from '@storybook/react'
import { Product Card } from './Product Card'

const meta: Meta<typeof Product Card> = {
  title: 'Components/Product Card',
  component: Product Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'E-commerce product card with image, pricing, and rating'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["default","compact","featured"]
    },
    title: {
      control: { type: 'text' }
    },
    price: {
      control: { type: 'text' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "default",
    title: undefined,
    price: undefined
  }
}

export const Default: Story = {
  args: {
    ...Default.args,
    variant: 'default'
  }
}

export const Compact: Story = {
  args: {
    ...Default.args,
    variant: 'compact'
  }
}

export const Featured: Story = {
  args: {
    ...Default.args,
    variant: 'featured'
  }
}