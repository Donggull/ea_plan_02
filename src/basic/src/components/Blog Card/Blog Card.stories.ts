import type { Meta, StoryObj } from '@storybook/react'
import BlogCard from './Blog Card'

const meta: Meta<typeof BlogCard> = {
  title: 'Components/Blog Card',
  component: BlogCard,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Blog post card with featured image, author info, and metadata'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["default","horizontal","minimal"]
    },
    title: {
      control: { type: 'text' }
    },
    excerpt: {
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
    excerpt: undefined
  }
}

export const DefaultVariant: Story = {
  args: {
    ...Default.args,
    variant: 'default'
  }
}

export const Horizontal: Story = {
  args: {
    ...Default.args,
    variant: 'horizontal'
  }
}

export const Minimal: Story = {
  args: {
    ...Default.args,
    variant: 'minimal'
  }
}