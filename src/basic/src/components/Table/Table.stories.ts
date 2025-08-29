import type { Meta, StoryObj } from '@storybook/react'
import Table from './Table'

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Data table with sorting and pagination support'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["default","striped","bordered"]
    },
    size: {
      control: { type: 'select' },
      options: ["sm","md","lg"]
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "default",
    size: "md"
  }
}

export const DefaultVariant: Story = {
  args: {
    ...Default.args,
    variant: 'default'
  }
}

export const Striped: Story = {
  args: {
    ...Default.args,
    variant: 'striped'
  }
}

export const Bordered: Story = {
  args: {
    ...Default.args,
    variant: 'bordered'
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