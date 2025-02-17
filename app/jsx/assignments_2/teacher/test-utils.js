/*
 * Copyright (C) 2018 - present Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import {TeacherViewContextDefaults} from './components/TeacherViewContext'
import {fireEvent, wait, waitForElement} from 'react-testing-library'
import {SAVE_ASSIGNMENT} from './assignmentData'

// because our version of jsdom doesn't support elt.closest('a') yet. Should soon.
export function closest(el, selector) {
  while (el && !el.matches(selector)) {
    el = el.parentElement
  }
  return el
}

export function findInputForLabel(labelChild, container) {
  const label = closest(labelChild, 'label')
  const input = container.querySelector(`#${label.getAttribute('for')}`)
  return input
}

export async function waitForNoElement(queryFn) {
  // use wait instead of waitForElement because waitForElement doesn't seem to
  // trigger the callback when elements disappear
  await wait(() => {
    let elt = null
    try {
      elt = queryFn()
    } catch (e) {
      // if queryFn throws, assume element can't be found and succeed
      return
    }

    // fail if the element was found
    if (elt !== null) throw new Error(`element is still present`)
  })
  // if the above didn't throw, then success
  return true
}

export function saveAssignmentResult(assignment, updates, response, errorMessage) {
  const result = {
    request: {
      query: SAVE_ASSIGNMENT,
      variables: {
        id: assignment.lid,
        ...updates
      }
    },
    result: {
      data: {
        updateAssignment: {
          assignment: {
            __typename: 'Assignment',
            id: assignment.gid,
            lid: assignment.lid,
            gid: assignment.gid,
            dueAt: assignment.dueAt,
            name: assignment.name,
            description: assignment.description,
            state: assignment.state,
            ...response
          }
        }
      }
    }
  }
  if (errorMessage !== undefined) {
    result.error = new Error(errorMessage)
  }
  return result
}

export function mockCourse(overrides) {
  return {
    lid: 'course-lid',
    assignmentGroupsConnection: {
      pageInfo: mockPageInfo(),
      nodes: []
    },
    modulesConnection: {
      pageInfo: mockPageInfo(),
      nodes: []
    },
    ...overrides
  }
}

export function mockPageInfo(overrides) {
  return {
    startCursor: 'startCursor',
    endCursor: 'endCursor',
    hasNextPage: false,
    hasPreviousPage: false,
    ...overrides
  }
}

export function mockAssignment(overrides) {
  return {
    __typename: 'Assignment',
    id: 'assignment-gid',
    gid: 'assignment-gid',
    lid: 'assignment-lid',
    name: 'Basic Mock Assignment',
    pointsPossible: 5,
    gradingType: 'points',
    dueAt: '2018-11-28T13:00-05:00',
    lockAt: '2018-11-29T13:00-05:00',
    unlockAt: '2018-11-27T13:00-05:00',
    description: 'assignment description',
    state: 'published',
    needsGradingCount: 0,
    course: mockCourse(),
    modules: [{lid: '1', name: 'module 1'}, {lid: '2', name: 'module 2'}],
    assignmentGroup: {lid: '1', name: 'assignment group'},
    lockInfo: {
      isLocked: false
    },
    submissionTypes: ['online_text_entry'],
    allowedExtensions: [],
    allowedAttempts: null,
    onlyVisibleToOverrides: false,
    assignmentOverrides: {
      pageInfo: mockPageInfo(),
      nodes: []
    },
    submissions: {
      pageInfo: mockPageInfo(),
      nodes: []
    },
    ...overrides
  }
}

export function mockOverride(overrides = {}) {
  return {
    __typename: 'AssignmentOverride',
    gid: '1',
    lid: '1',
    title: 'Section A',
    dueAt: '2018-12-25T23:59:59-05:00',
    allDay: true,
    lockAt: '2018-12-29T23:59:00-05:00',
    unlockAt: '2018-12-23T00:00:00-05:00',
    set: {
      __typename: 'Section',
      lid: '10',
      sectionName: 'Section A'
    },
    // copied from assignment
    allowedAttempts: null,
    submissionTypes: [],
    allowedExtensions: [],
    ...overrides
  }
}

export function mockSubmission(overrides) {
  return {
    __typename: 'Submission',
    gid: '1',
    lid: '1',
    state: 'submitted',
    submissionStatus: 'submitted',
    grade: '4',
    gradingStatus: 'needs_grading',
    excused: false,
    latePolicyStatus: null,
    score: 4,
    submittedAt: '2019-01-17T12:21:42Z',
    user: mockUser(),
    assetId: '2',
    assetType: 'Submission',
    assessorId: '3',
    assessorAssetId: '33',
    assessorAssetType: 'Submission',
    submissionHistories: {
      nodes: [
        {
          attempt: 1,
          submittedAt: '2019-01-17T12:21:42Z',
          score: 4
        }
      ]
    },
    ...overrides
  }
}

export function mockUser(overrides) {
  return {
    __typename: 'User',
    lid: 'user_1',
    gid: 'user_1',
    name: 'Juan User',
    shortName: 'Juan',
    sortableName: 'User, Juan',
    email: 'juan_user1@example.com',
    avatarUrl: 'http://host.test',
    ...overrides
  }
}

// values need to match the defaults for TeacherViewContext
export const mockTeacherContext = () => ({...TeacherViewContextDefaults})

// because jsdom doesn't define matchMedia
window.matchMedia =
  window.matchMedia ||
  (() => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {}
  }))

export function itBehavesLikeADialog({
  // render may be async.
  render,
  // other functions will be wrapped in a wait* method and should not be async
  getOpenDialogElt,
  confirmDialogOpen,
  getCancelDialogElt
}) {
  // skipped because the close tests regularly timeout in jenkins
  describe('behaves like a dialog', () => {
    async function openTheDialog() {
      const fns = await render()
      const openDialogTrigger = getOpenDialogElt(fns)
      fireEvent.click(openDialogTrigger)
      expect(await waitForElement(() => confirmDialogOpen(fns))).toBeInTheDocument()
      return fns
    }

    it('is initially not open', async () => {
      // test with a throw just so they don't have to pass both a get* and a query* function
      const fns = await render()
      expect(() => confirmDialogOpen(fns)).toThrow()
    })

    it('closes when close is clicked', async () => {
      const fns = await openTheDialog()
      fireEvent.click(fns.getByTestId('confirm-dialog-close-button'))
      expect(await waitForNoElement(() => confirmDialogOpen(fns))).toBe(true)
    })

    it('closes when cancel is clicked', async () => {
      const fns = await openTheDialog()
      fireEvent.click(getCancelDialogElt(fns))
      expect(await waitForNoElement(() => confirmDialogOpen(fns))).toBe(true)
    })
  })
}
