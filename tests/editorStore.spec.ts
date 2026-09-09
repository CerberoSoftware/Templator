import { beforeEach, describe, expect, it } from 'vitest'
import { useEditor } from '../src/stores/editor'
import { emptyDoc, type Block, type EmailDoc } from '../src/builder/model'
import { createBlock } from '../src/builder/blocks'

function docWith(...types: Array<Parameters<typeof createBlock>[0]>): EmailDoc {
  const doc = emptyDoc()
  doc.blocks = types.map((t, i) => {
    const block = createBlock(t)
    block.id = `b${i}`
    return block
  })
  return doc
}

const ids = () => useEditor.getState().doc.blocks.map((b) => b.id)

describe('nudgeBlock', () => {
  beforeEach(() => useEditor.getState().load(1, 'Test', docWith('heading', 'text', 'button')))

  it('moves a block up one position', () => {
    useEditor.getState().nudgeBlock('b1', -1)
    expect(ids()).toEqual(['b1', 'b0', 'b2'])
  })

  it('moves a block down one position', () => {
    useEditor.getState().nudgeBlock('b1', 1)
    expect(ids()).toEqual(['b0', 'b2', 'b1'])
  })

  it('leaves the ends alone', () => {
    useEditor.getState().nudgeBlock('b0', -1)
    useEditor.getState().nudgeBlock('b2', 1)
    expect(ids()).toEqual(['b0', 'b1', 'b2'])
  })

  it('keeps the moved block selected, and is undoable', () => {
    useEditor.getState().nudgeBlock('b2', -1)
    expect(useEditor.getState().selectedId).toBe('b2')
    useEditor.getState().undo()
    expect(ids()).toEqual(['b0', 'b1', 'b2'])
  })

  it('reorders within a column without escaping it', () => {
    const doc = emptyDoc()
    const twocol = createBlock('twocol') as Block & { type: 'twocol' }
    twocol.id = 'col'
    const first = createBlock('text')
    first.id = 'c0'
    const second = createBlock('button')
    second.id = 'c1'
    twocol.columns[0] = [first, second]
    doc.blocks = [twocol]
    useEditor.getState().load(1, 'Test', doc)

    useEditor.getState().nudgeBlock('c1', -1)
    const container = useEditor.getState().doc.blocks[0]
    if (container.type !== 'twocol') throw new Error('expected a twocol block')
    expect(container.columns[0].map((b) => b.id)).toEqual(['c1', 'c0'])
    expect(useEditor.getState().doc.blocks).toHaveLength(1)
  })
})
