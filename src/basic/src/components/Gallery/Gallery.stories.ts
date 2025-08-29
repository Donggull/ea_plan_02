import type { Meta, StoryObj } from '@storybook/react'
import Gallery from './Gallery'

const meta: Meta<typeof Gallery> = {
  title: 'Components/Gallery',
  component: Gallery,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Image gallery with grid, masonry, and carousel layouts'
      }
    }
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ["grid","masonry","carousel"]
    },
    columns: {
      control: { type: 'number' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    variant: "grid",
    columns: 3
  }
}

export const Grid: Story = {
  args: {
    ...Default.args,
    variant: 'grid'
  }
}

export const Masonry: Story = {
  args: {
    ...Default.args,
    variant: 'masonry'
  }
}

export const Carousel: Story = {
  args: {
    ...Default.args,
    variant: 'carousel'
  }
}