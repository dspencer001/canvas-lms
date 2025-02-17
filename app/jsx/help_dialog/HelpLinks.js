/*
 * Copyright (C) 2016 - present Instructure, Inc.
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
import {bool, arrayOf, shape, string, func} from 'prop-types'
import I18n from 'i18n!help_dialog'
import Button from '@instructure/ui-buttons/lib/components/Button'
import List, {ListItem} from '@instructure/ui-elements/lib/components/List'
import Spinner from '@instructure/ui-elements/lib/components/Spinner'
import Text from '@instructure/ui-elements/lib/components/Text'
import View from '@instructure/ui-layout/lib/components/View'

export default function HelpLinks({links, hasLoaded, onClick}) {
  return (
    <List variant="unstyled" margin="small 0" itemSpacing="medium">
      {hasLoaded ? (
        links
          .map((link, index) => (
            <ListItem key={`link-${index}`}>
              <Button
                variant="link"
                href={link.url}
                target="_blank"
                rel="noopener"
                onClick={event => {
                  if (link.url === '#create_ticket' || link.url === '#teacher_feedback') {
                    event.preventDefault()
                    onClick(link.url)
                  }
                }}
              >
                {link.text}
              </Button>
              {link.subtext && (
                <View as="div" padding="0 0 0 small">
                  <Text size="small">
                    {link.subtext}
                  </Text>
                </View>
              )}
            </ListItem>
          ))
          .concat(
            // if the current user is an admin, show the settings link to
            // customize this menu
            window.ENV.current_user_roles &&
              window.ENV.current_user_roles.includes('root_admin') && [
                <ListItem key="hr">
                  <hr role="presentation" />
                </ListItem>,
                <ListItem key="customize">
                  <Button variant="link" href="/accounts/self/settings#custom_help_link_settings">
                    {I18n.t('Customize this menu')}
                  </Button>
                </ListItem>
              ]
          )
          .filter(Boolean)
      ) : (
        <ListItem>
          <Spinner size="small" title={I18n.t('Loading')} />
        </ListItem>
      )}
    </List>
  )
}

HelpLinks.propTypes = {
  links: arrayOf(
    shape({
      url: string.isRequired,
      text: string.isRequired,
      subtext: string
    })
  ).isRequired,
  hasLoaded: bool,
  onClick: func
}

HelpLinks.defaultProps = {
  hasLoaded: false,
  links: [],
  onClick: () => {}
}
