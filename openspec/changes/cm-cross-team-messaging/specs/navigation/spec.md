## ADDED Requirements

### Requirement: Messages tab in sidebar navigation
The left sidebar (RoleSidebar) SHALL include a Messages tab that navigates to the 'messages' view. The tab SHALL display an unread message count badge when the user has unread messages.

#### Scenario: Messages tab is visible
- **WHEN** any authenticated CM views the application
- **THEN** a Messages tab is present in the left sidebar alongside existing tabs

#### Scenario: Unread badge is visible
- **WHEN** the current user has one or more unread messages
- **THEN** the Messages sidebar tab displays the unread count as a badge

#### Scenario: Badge is hidden when no unread messages
- **WHEN** the current user has no unread messages
- **THEN** no badge is shown on the Messages tab

#### Scenario: Navigating to messages view
- **WHEN** a CM clicks the Messages tab
- **THEN** the app navigates to the 'messages' view and the unread badge clears for conversations the user reads
