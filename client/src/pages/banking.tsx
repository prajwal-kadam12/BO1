import { Plus, Search, Filter, Landmark, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export default function Banking() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">Banking</h1>
          <p className="text-muted-foreground">Connect and manage your bank accounts for reconciliation.</p>
        </div>
        <Button className="gap-2 shadow-lg shadow-primary/20">
          <Link2 className="h-4 w-4" /> Connect Bank
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search transactions..." className="pl-9" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" /> Filter
        </Button>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Landmark className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No bank accounts connected</h3>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Connect your bank accounts to automatically import transactions and reconcile your books.
          </p>
          <Button className="gap-2">
            <Link2 className="h-4 w-4" /> Connect Your First Bank Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
