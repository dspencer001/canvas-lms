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

import React from 'react'
import StudentContent from './components/StudentContent'
import {string} from 'prop-types'
import {Query} from 'react-apollo'
import GenericErrorPage from '../../shared/components/GenericErrorPage/index'
import errorShipUrl from './SVG/ErrorShip.svg'
import {GetAssignmentEnvVariables, NEXT_SUBMISSION, STUDENT_VIEW_QUERY} from './assignmentData'
import LoadingIndicator from '../shared/LoadingIndicator'

const StudentView = props => (
  <Query query={STUDENT_VIEW_QUERY} variables={{assignmentLid: props.assignmentLid}}>
    {({loading, error, data, fetchMore}) => {
      if (loading) return <LoadingIndicator />
      if (error) {
        return (
          <GenericErrorPage
            imageUrl={errorShipUrl}
            errorSubject="Assignments 2 Student initial query error"
            errorCategory="Assignments 2 Student Error Page"
          />
        )
      }

      document.title = data.assignment.name

      const dataCopy = JSON.parse(JSON.stringify(data))
      const assignment = dataCopy.assignment
      assignment.env = GetAssignmentEnvVariables()

      let submission = null
      if (assignment.submissionsConnection && assignment.submissionsConnection.nodes.length !== 0) {
        submission = assignment.submissionsConnection.nodes[0]
      }
      delete assignment.submissionsConnection

      return (
        <StudentContent
          assignment={assignment}
          pageInfo={submission && submission.submissionHistoriesConnection.pageInfo}
          submissionHistoryEdges={submission && submission.submissionHistoriesConnection.edges}
          onLoadMore={() => {
            if (!submission) {
              return
            }

            return fetchMore({
              query: NEXT_SUBMISSION,
              variables: {
                cursor: submission.submissionHistoriesConnection.pageInfo.startCursor,
                submissionID: submission.submissionHistoriesConnection.edges[0].node.rootId
              },
              updateQuery: (previousResult, {fetchMoreResult}) => {
                const nextResult = JSON.parse(JSON.stringify(previousResult))
                const histories =
                  nextResult.assignment.submissionsConnection.nodes[0].submissionHistoriesConnection
                const nextPageInfo =
                  fetchMoreResult.legacyNode.submissionHistoriesConnection.pageInfo
                const newHistory = fetchMoreResult.legacyNode.submissionHistoriesConnection.edges[0]
                const newHistories = [newHistory, ...histories.edges]
                nextResult.assignment.submissionsConnection.nodes[0].submissionHistoriesConnection.pageInfo = nextPageInfo
                nextResult.assignment.submissionsConnection.nodes[0].submissionHistoriesConnection.edges = newHistories
                return nextResult
              }
            })
          }}
        />
      )
    }}
  </Query>
)

StudentView.propTypes = {
  assignmentLid: string.isRequired
}

export default React.memo(StudentView)
