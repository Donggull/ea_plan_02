import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Status badge for displaying small pieces of information'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["default","primary","secondary","success","warning","error"]
    },
    size: {
      control: { type: 'select' },
      options: ["sm","md","lg"]
    },
    rounded: {
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "default",
    size: "md",
    rounded: false
  }
}

export const Default: Story = {
  args: {
    ...Default.args,
    variant: 'default'
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

export const Success: Story = {
  args: {
    ...Default.args,
    variant: 'success'
  }
}

export const Warning: Story = {
  args: {
    ...Default.args,
    variant: 'warning'
  }
}

export const Error: Story = {
  args: {
    ...Default.args,
    variant: 'error'
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