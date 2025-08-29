import type { Meta, StoryObj } from '@storybook/react'
import { Enhanced Button } from './Enhanced Button'

const meta: Meta<typeof Enhanced Button> = {
  title: 'Components/Enhanced Button',
  component: Enhanced Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enhanced button with accessibility, loading states, and icon support'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["primary","secondary","outline","ghost","destructive"]
    },
    size: {
      control: { type: 'select' },
      options: ["xs","sm","md","lg","xl"]
    },
    loading: {
      control: { type: 'boolean' }
    },
    fullWidth: {
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "primary",
    size: "md",
    loading: false,
    fullWidth: false
  }
}

export const Primary: Story = {
  args: {
    ...Default.args,
    variant: 'primary'
  }
}

export const Secondary: Story = {
  args: {
    ...Default.args,
    variant: 'secondary'
  }
}

export const Outline: Story = {
  args: {
    ...Default.args,
    variant: 'outline'
  }
}

export const Ghost: Story = {
  args: {
    ...Default.args,
    variant: 'ghost'
  }
}

export const Destructive: Story = {
  args: {
    ...Default.args,
    variant: 'destructive'
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