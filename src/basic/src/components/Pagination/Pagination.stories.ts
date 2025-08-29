import type { Meta, StoryObj } from '@storybook/react'
import Pagination from './Pagination'

const meta: Meta<typeof Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Pagination component for data navigation'
      }
    }
  },
  argTypes: {
    pageSize: {
      control: { type: 'number' }
    },
    showSizeChanger: {
      control: { type: 'boolean' }
    },
    showQuickJumper: {
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    pageSize: 10,
    showSizeChanger: false,
    showQuickJumper: false
  }
}

