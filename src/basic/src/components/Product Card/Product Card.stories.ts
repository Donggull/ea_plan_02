import type { Meta, StoryObj } from '@storybook/react'
import ProductCard from './Product Card'

const meta: Meta<typeof ProductCard> = {
  title: 'Components/Product Card',
  component: ProductCard,
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

export const DefaultVariant: Story = {
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