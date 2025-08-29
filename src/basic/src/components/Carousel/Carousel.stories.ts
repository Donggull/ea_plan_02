import type { Meta, StoryObj } from '@storybook/react'
import { Carousel } from './Carousel'

const meta: Meta<typeof Carousel> = {
  title: 'Components/Carousel',
  component: Carousel,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Image and content carousel with navigation'
      }
    }
  },
  argTypes: {
    autoplay: {
      control: { type: 'boolean' }
    },
    autoplayDelay: {
      control: { type: 'number' }
    },
    infinite: {
      control: { type: 'boolean' }
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    autoplay: false,
    autoplayDelay: 3000,
    infinite: true
  }
}

