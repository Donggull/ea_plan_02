import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'User avatar with fallback support'
      }
    }
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ["xs","sm","md","lg","xl"]
    },
    variant: {
      control: { type: 'select' },
      options: ["circle","square"]
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    size: "md",
    variant: "circle"
  }
}

export const Xs: Story = {
  args: {
    ...Default.args,
    size: 'xs'
  }
}

export const Sm: Story = {
  args: {
    ...Default.args,
    size: 'sm'
  }
}

export const Md: Story = {
  args: {
    ...Default.args,
    size: 'md'
  }
}

export const Lg: Story = {
  args: {
    ...Default.args,
    size: 'lg'
  }
}

export const Xl: Story = {
  args: {
    ...Default.args,
    size: 'xl'
  }
}

export const Circle: Story = {
  args: {
    ...Default.args,
    variant: 'circle'
  }
}

export const Square: Story = {
  args: {
    ...Default.args,
    variant: 'square'
  }
}