import type { Meta, StoryObj } from '@storybook/react'
import EnhancedModal from './Enhanced Modal'

const meta: Meta<typeof EnhancedModal> = {
  title: 'Components/Enhanced Modal',
  component: EnhancedModal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Enhanced modal with focus trap, keyboard navigation, and accessibility features'
      }
    }
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ["xs","sm","md","lg","xl","full"]
    },
    closeOnOverlayClick: {
      control: { type: 'boolean' }
    },
    preventBodyScroll: {
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    size: "md",
    closeOnOverlayClick: true,
    preventBodyScroll: true
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

export const Full: Story = {
  args: {
    ...Default.args,
    size: 'full'
  }
}