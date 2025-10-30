import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ApiKeyInput } from './ApiKeyInput';
import { SystemConfig } from './SystemConfig';
import { Database } from './Database';
import { ADDMSettings } from './ADDMSettings';

export function SettingsPanel() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your Hybrid Swarm system</p>
      </div>

      <Tabs defaultValue="api" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api">API</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="addm">ADDM</TabsTrigger>
        </TabsList>

        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>OpenRouter API Key</CardTitle>
              <CardDescription>
                Configure your OpenRouter API key for LLM execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ApiKeyInput />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>Coordination Parameters</CardTitle>
              <CardDescription>
                Adjust vigilance, decay rate, and other coordination settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SystemConfig />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Management</CardTitle>
              <CardDescription>
                View and manage IndexedDB storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Database />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addm">
          <ADDMSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
