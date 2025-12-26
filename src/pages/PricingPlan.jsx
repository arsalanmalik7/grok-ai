import { useState, useEffect } from "react";
import { useStripe } from "@stripe/react-stripe-js";
import { useAuth } from "../context/AuthContext";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";
import { useSearchParams, useNavigate } from "react-router-dom";

const PricingPlan = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [priceId, setPriceId] = useState(null);
  const stripe = useStripe();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      const sessionId = searchParams.get("session_id"); // Assuming backend returns session_id or we use a success flag
      const success = searchParams.get("success");
      console.log(currentUser, success);
      
      if ((sessionId || success) && currentUser) {
        const storedPriceId = localStorage.getItem("selectedPriceId");
        
        if (storedPriceId) {
          try {
            let planName = "Basic";
            if (storedPriceId === "price_1ScaiTRf3D8pr3UQCedaozfJ") planName = "SuperMagna AI";
            if (storedPriceId === "price_1ScaitRf3D8pr3UQjjhSBATb") planName = "SuperMagna AI Heavy";

            await setDoc(doc(db, "users", currentUser.uid), {
              subscription: {
                plan: planName,
                priceId: storedPriceId,
                status: "active",
                updatedAt: new Date().toISOString()
              }
            }, { merge: true });

            localStorage.removeItem("selectedPriceId");
            alert(`Successfully subscribed to ${planName}!`);
            navigate("/dashboard");
          } catch (error) {
            console.error("Error saving subscription:", error);
          }
        }
      }
    };

    checkSubscription();
  }, [currentUser, searchParams, navigate]);

  const handleCheckout = async (priceId) => {
    if (!currentUser) {
      alert("Please log in to upgrade your plan.");
      return;
    }
    setPriceId(priceId);

    setLoading(true);
    localStorage.setItem("selectedPriceId", priceId);

    try {
      const response = await fetch("http://localhost:3001/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appUrl: window.location.href + "?success=true", // Append success flag for return URL
          successUrl:window.location.href ,
          cancelUrl:window.location.href,
          email: currentUser.email,
          priceId: priceId,
        }),
      });

      const data = await response.json();

      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else if (data.url) {
        window.location.href = data.url;
      } else if (data.sessionId) {
        const { error } = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (error) {
          console.error("Stripe redirect error:", error);
          alert("Failed to redirect to checkout.");
        }
      } else {
        console.error("No checkout URL or session ID returned");
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("Failed to initiate checkout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-2">Our Plans</h1>
        <p className="text-gray-600">Choose the plan that works best for you</p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className="border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Basic</h2>
          <p className="text-3xl font-bold mb-4">$0</p>
          <button className="w-full bg-gray-200 py-2 rounded-lg font-medium">
            Current Plan
          </button>

          <ul className="mt-6 space-y-2 text-gray-600">
            <li>• Limited access to chat models</li>
            <li>• Limited context memory</li>
            <li>• Aurora image model</li>
            <li>• Voice access</li>
            <li>• Projects</li>
            <li>• Tasks</li>
          </ul>
        </div>

        {/* $30 Plan */}
        <div className="border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">SuperMagna AI</h2>
          <p className="text-3xl font-bold mb-4">$30/month</p>

          <button 
            onClick={() => handleCheckout("price_1ScaiTRf3D8pr3UQCedaozfJ")}
            disabled={loading}
            className="w-full bg-black cursor-pointer text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && priceId === "price_1ScaiTRf3D8pr3UQCedaozfJ" ? "Processing..." : "Upgrade to SuperMagna AI"}
          </button>

          <ul className="mt-6 space-y-2 text-gray-600">
            <li>• Increased access to Magna AI 4.1</li>
            <li>• Improved reasoning</li>
            <li>• Increased access to Magna AI 3</li>
            <li>• Extended memory</li>
            <li>• Priority voice access</li>
            <li>• Image model</li>
            <li>• Companions</li>
            <li>• Everything in Basic</li>
          </ul>
        </div>

        {/* $300 Plan */}
        <div className="border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">SuperMagna AI Heavy</h2>
          <p className="text-3xl font-bold mb-4">$300/month</p>

          <button 
            onClick={() => handleCheckout("price_1ScaitRf3D8pr3UQjjhSBATb")}
            disabled={loading}
            className="w-full bg-black cursor-pointer text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && priceId === "price_1ScaitRf3D8pr3UQjjhSBATb" ? "Processing..." : "Upgrade to Heavy"}
          </button>

          <ul className="mt-6 space-y-2 text-gray-600">
            <li>• Exclusive preview features</li>
            <li>• Extended access</li>
            <li>• Unlimited Magna AI 3</li>
            <li>• Longest memory</li>
            <li>• Early access</li>
            <li>• Everything in SuperMagna AI</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PricingPlan;
