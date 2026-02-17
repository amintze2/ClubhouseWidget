import { FormEvent, KeyboardEvent, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';

const DIETARY_ITEM_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Gluten-free',
  'Dairy-free',
  'Nut allergy',
  'Peanut allergy',
  'Shellfish allergy',
  'Egg allergy',
  'Sesame allergy',
  'Halal',
  'Kosher',
  'Other',
] as const;

export function PlayerInfo() {
  const { user } = useAuth();

  const playerName = useMemo(() => user?.user_name?.trim() || '', [user?.user_name]);
  const headerText = playerName ? `Welcome ${playerName}` : 'Welcome Player';

  const [preferredName, setPreferredName] = useState('');
  const [selectedDietaryItems, setSelectedDietaryItems] = useState<string[]>([]);
  const [itemToAdd, setItemToAdd] = useState<string | undefined>(undefined);
  const [showOtherItemInput, setShowOtherItemInput] = useState(false);
  const [otherItemInput, setOtherItemInput] = useState('');
  const [otherItemError, setOtherItemError] = useState('');
  const [otherDetails, setOtherDetails] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const hasDuplicateItem = (value: string) =>
    selectedDietaryItems.some((item) => item.toLowerCase() === value.toLowerCase());

  const handleAddOtherItem = () => {
    const trimmedValue = otherItemInput.trim();

    if (!trimmedValue) {
      setOtherItemError('Please specify an item before adding.');
      return;
    }

    if (hasDuplicateItem(trimmedValue)) {
      setOtherItemError('That item is already selected.');
      return;
    }

    setSelectedDietaryItems((prev) => [...prev, trimmedValue]);
    setOtherItemInput('');
    setOtherItemError('');
    setShowOtherItemInput(false);
    setSaveMessage('');
  };

  const handleOtherItemKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddOtherItem();
    }
  };

  const handleAddItem = (value: string) => {
    setItemToAdd(undefined);
    setSaveMessage('');

    if (value === 'Other') {
      setShowOtherItemInput(true);
      setOtherItemError('');
      return;
    }

    if (!hasDuplicateItem(value)) {
      setSelectedDietaryItems((prev) => [...prev, value]);
    }
  };

  const handleRemoveItem = (item: string) => {
    setSelectedDietaryItems((prev) => prev.filter((entry) => entry !== item));
    setSaveMessage('');
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveMessage('');
    setIsSaving(true);

    const payload = {
      preferredName: preferredName.trim(),
      selectedDietaryItems,
      otherDetails: otherDetails.trim(),
      submittedAt: new Date().toISOString(),
    };

    // TODO: send player info to Postgres via AWS API; clubhouse managers will use this info.
    console.log('Player info payload:', payload);

    await new Promise((resolve) => setTimeout(resolve, 700));

    setIsSaving(false);
    setSaveMessage('Saved. Clubhouse managers can now use this information.');
  };

  return (
    <div className="space-y-6 p-8">
      <div className="space-y-2">
        <h2 className="text-2xl">{headerText}</h2>
        {playerName && <Badge variant="secondary">{playerName}</Badge>}
        <p className="text-sm text-muted-foreground">
          This information goes to clubhouse managers for meal planning and preparation.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle>Player Preferences</CardTitle>
            <CardDescription>Share how staff should refer to you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="preferred-name">Preferred name</Label>
            <Input
              id="preferred-name"
              value={preferredName}
              onChange={(event) => {
                setPreferredName(event.target.value);
                setSaveMessage('');
              }}
              placeholder={playerName ? `Example: ${playerName}` : 'Example: JP'}
            />
            <p className="text-sm text-muted-foreground">Optional. Leave blank to use your account name.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dietary Restrictions and Allergies</CardTitle>
            <CardDescription>Select anything the clubhouse team should account for.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-dietary-item">Add an item</Label>
              <Select value={itemToAdd} onValueChange={handleAddItem}>
                <SelectTrigger id="add-dietary-item">
                  <SelectValue placeholder="Select a restriction or allergy" />
                </SelectTrigger>
                <SelectContent>
                  {DIETARY_ITEM_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showOtherItemInput && (
              <div className="space-y-2">
                <Label htmlFor="specify-other-item">Specify other item</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="specify-other-item"
                    value={otherItemInput}
                    onChange={(event) => {
                      setOtherItemInput(event.target.value);
                      if (otherItemError) {
                        setOtherItemError('');
                      }
                    }}
                    onKeyDown={handleOtherItemKeyDown}
                    placeholder="Example: No pork, Low sodium, Avoid spicy food"
                  />
                  <Button type="button" onClick={handleAddOtherItem}>
                    Add
                  </Button>
                </div>
                {otherItemError && <p className="text-sm text-destructive">{otherItemError}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label>Selected items</Label>
              {selectedDietaryItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items selected.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedDietaryItems.map((item) => (
                    <div key={item} className="flex items-center gap-1">
                      <Badge variant="secondary">{item}</Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveItem(item)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="other-details">Other details</Label>
              <Textarea
                id="other-details"
                value={otherDetails}
                onChange={(event) => {
                  setOtherDetails(event.target.value);
                  setSaveMessage('');
                }}
                placeholder="Add anything else the clubhouse team should know"
                rows={3}
              />
              <p className="text-sm text-muted-foreground">
                Add specifics like severity, cross-contamination concerns, or anything not listed above.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          {saveMessage && (
            <Alert>
              <AlertTitle>Saved</AlertTitle>
              <AlertDescription>{saveMessage}</AlertDescription>
            </Alert>
          )}
        </div>
      </form>
    </div>
  );
}
