import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "#/components/ui/button";
import { Input } from "#/components/ui/input";
import { Label } from "#/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "#/components/ui/card";
import { useToast } from "#/components/ui/use-toast";
import { useAuth } from "#/context/auth-context";

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated } = useAuth();
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(username, password);
      
      if (success) {
        toast({
          title: t("Login successful"),
          description: t("Welcome back, {{username}}!", { username }),
        });
        navigate("/");
      } else {
        toast({
          title: t("Login failed"),
          description: t("Invalid username or password"),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("Login error"),
        description: t("An error occurred during login. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-base">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("Login to OpenHands")}</CardTitle>
          <CardDescription>
            {t("Enter your credentials to access the application")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("Username")}</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={t("Enter your username")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("Password")}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={t("Enter your password")}
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? t("Logging in...") : t("Login")}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}