import type { Meta, StoryObj } from '@storybook/react'
import { Modal } from './Modal'

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Basic modal dialog component'
      }
    }
  },
  argTypes: {
    isOpen: {
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    isOpen: undefined
  }
}

